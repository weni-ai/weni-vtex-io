/* eslint-disable @typescript-eslint/no-explicit-any */
export async function allStates(
  ctx: StatusChangeContext,
  next: () => Promise<any>
) {
  try {
    const updatedBody = {
      ...ctx.body,
      vtexAccount: ctx.vtex.account,
    }

    // Get authentication token using InternalWeniAuthClient
    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    const { commerceClient } = ctx.clients

    // Send event to Commerce webhook-order-status endpoint
    await commerceClient.sendOrderStatusNotification(
      updatedBody,
      headers.Authorization
    )

    await next()
  } catch (error) {
    console.error('Error processing order event:', error)
  }
}
