import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

/**
 * Middleware to proxy abandoned cart notifications to the Commerce backend.
 * Receives the request payload and forwards it to the internal notification endpoint.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function proxyAbandonedCartNotification(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  try {
    // Parse the JSON body of the incoming request
    const requestBody = await json(ctx.req)

    // Validate that required fields are present
    const { cart_id, account, phone, store } = requestBody
    if (!cart_id || !account || !phone || !store) {
      ctx.status = 400
      ctx.body = { message: 'Missing required fields in request body - required: cart_id, account, phone, store', body: requestBody }
      return
    }

    // Get authentication token using InternalWeniAuthClient
    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    // Forward the request body to the Commerce backend via the client
    const commerceClient = ctx.clients.commerceClient
    const response = await commerceClient.sendAbandonedCartNotification(requestBody, headers.Authorization)

    // Ensure status is a valid number and set the response accordingly
    ctx.status = typeof response?.status === 'number' ? response.status : 200
    ctx.body = response.data || { message: 'Notification processed successfully' }
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error while proxying abandoned cart notification:', error)

    // Handle errors and provide meaningful feedback
    const errorStatus = error.response?.status
    ctx.status = typeof errorStatus === 'number' ? errorStatus : 500
    ctx.body = {
      message: 'Failed to process abandoned cart notification',
      error: error.message || 'Internal server error',
    }
  }

  await next()
}
