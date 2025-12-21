/* eslint-disable @typescript-eslint/no-explicit-any */
import { isPhoneNumberIgnored } from '../utils/phoneValidator'
import { getJWTAuthHeaders } from '../utils/jwtGenerator'

export async function allStates(
  ctx: StatusChangeContext,
  next: () => Promise<any>
) {
  try {
    const updatedBody = {
      ...ctx.body,
      vtexAccount: ctx.vtex.account,
    }

    // Extract orderId from the request body
    const { orderId } = updatedBody

    if (orderId) {
      try {
        // Get order details to check phone number
        const { omsClient } = ctx.clients
        const orderDetails = await omsClient.getOrderById(orderId)

        // Extract phone number from clientProfileData
        const phone = orderDetails?.clientProfileData?.phone

        if (phone) {
          // Check if phone number is in the ignore list
          const isIgnoredNumber = isPhoneNumberIgnored(phone)

          if (isIgnoredNumber) {
            // Silently ignore this order (no console output)
            await next()

            return
          }
        }
      } catch (orderError) {
        console.error(
          `Error fetching order details for ${orderId}:`,
          orderError
        )
        // Continue processing even if we can't fetch order details
      }
    }

    // Generate JWT token locally with vtex_account (no external OIDC call needed)
    const headers = getJWTAuthHeaders(ctx.vtex.account)

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
