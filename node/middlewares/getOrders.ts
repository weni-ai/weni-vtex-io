import { Clients } from "../clients";
import { ServiceContext } from "@vtex/api";

/**
 * Middleware to fetch orders from the OMS API.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getOrders(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  try {
    // Remove the token from the query parameters
    delete ctx.query.token
    const client = ctx.clients.omsClient

    const response = await client.getOrders(ctx.query)

    ctx.status = 200
    ctx.body = response
  } catch (error) {
    console.error('Error fetching orders:', error)
    ctx.status = (error as any).response?.status || 500
    ctx.body = (error as any).response?.data || 'An error occurred while fetching orders'
  }

  await next()
}
