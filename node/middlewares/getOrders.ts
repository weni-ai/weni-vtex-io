import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Middleware to fetch orders from the OMS API.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getOrders(
  ctx: ServiceContext<Clients>,
  next: () => Promise<any>
) {
  try {
    // Parse request body if available
    let requestBody: Record<string, any> = {}

    if (ctx.req) {
      try {
        requestBody = await json(ctx.req)
      } catch (e) {
        // Silently fail if body parsing fails - might be GET request without body
      }
    }

    // Get query parameters from request
    let queryParams: string | Record<string, any>

    // Check if request has a body with raw_query
    if (requestBody && 'raw_query' in requestBody) {
      queryParams = requestBody.raw_query as string
    } else if (ctx.query) {
      // Fallback to URL query parameters if no raw_query in body
      queryParams = ctx.query
    } else {
      ctx.status = 400
      ctx.body = { message: 'No query parameters provided.' }

      return
    }

    // Validate query parameters
    if (
      typeof queryParams !== 'string' &&
      Object.keys(queryParams).length === 0
    ) {
      ctx.status = 400
      ctx.body = { message: 'Query parameters cannot be empty.' }

      return
    }

    const client = ctx.clients.omsClient
    const response = await client.getOrders(queryParams)

    ctx.status = 200
    ctx.body = response
  } catch (error) {
    console.error('Error fetching orders:', error)

    ctx.status = (error as any).response?.status || 500
    ctx.body = {
      message: 'Error fetching orders',
      error: (error as any).response?.data || (error as Error).message,
    }
  }

  await next()
}
