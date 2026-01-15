import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'
import { getJWTAuthHeaders } from '../utils/jwtGenerator'

/**
 * Sets CORS headers on the response to allow cross-origin requests.
 * Required when the storefront uses a custom domain (e.g., loja.com.br)
 * but the request is sent to the myvtex.com domain.
 *
 * @param ctx - VTEX IO context object.
 */
function setCorsHeaders(ctx: ServiceContext<Clients>) {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  ctx.set('Access-Control-Allow-Headers', '*')
  ctx.set('Access-Control-Max-Age', '86400')
}

/**
 * Middleware to proxy abandoned cart notifications to the Commerce backend.
 * Receives the request payload and forwards it to the internal notification endpoint.
 * Uses JWT token for authentication (no external OIDC call needed).
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function proxyAbandonedCartNotification(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  // Set CORS headers for cross-origin requests from custom domains
  setCorsHeaders(ctx)

  // Handle preflight OPTIONS request
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204
    ctx.body = ''

    return
  }

  try {
    // Parse the JSON body of the incoming request
    const requestBody = await json(ctx.req)

    // Validate that required fields are present
    const { cart_id: cartId, account, phone, name } = requestBody

    if (!cartId || !account || !phone || !name) {
      ctx.status = 400
      ctx.body = {
        message:
          'Missing required fields in request body - required: cart_id, account, phone, name',
        body: requestBody,
      }

      return
    }

    // Generate JWT token locally with vtex_account (no external OIDC call needed)
    const headers = getJWTAuthHeaders(account)

    // Forward the request body to the Commerce backend via the client
    const { commerceClient } = ctx.clients
    const response = await commerceClient.sendAbandonedCartNotification(
      requestBody,
      headers.Authorization
    )

    // Ensure status is a valid number and set the response accordingly
    ctx.status = typeof response?.status === 'number' ? response.status : 200
    ctx.body = response.data ?? {
      message: 'Notification processed successfully',
    }
  } catch (error) {
    const err = error as Error & { response?: { status?: number } }

    // Log the error for debugging purposes
    // eslint-disable-next-line no-console
    console.error('Error while proxying abandoned cart notification:', err)

    // Handle errors and provide meaningful feedback
    const errorStatus = err.response?.status

    ctx.status = typeof errorStatus === 'number' ? errorStatus : 500
    ctx.body = {
      message: 'Failed to process abandoned cart notification',
      error: err.message ?? 'Internal server error',
    }
  }

  await next()
}
