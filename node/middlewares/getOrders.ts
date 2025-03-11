import { Clients } from "../clients";
import { ServiceContext } from "@vtex/api";

export async function getOrders(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  try {
    const { token, ...queryParams } = ctx.query
    const client = ctx.clients.omsClient

    const response = await client.getOrders(queryParams)

    ctx.status = 200
    ctx.body = response
  } catch (error) {
    console.error('Error fetching orders:', error)
    ctx.status = (error as any).response?.status || 500
    ctx.body = (error as any).response?.data || 'An error occurred while fetching orders'
  }

  await next()
}
