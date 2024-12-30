import { ServiceContext } from '@vtex/api'
import type { Clients } from '../clients'

/**
 * Middleware to fetch order form details by ID.
 * @param ctx - Service context.
 * @param next - Next middleware function.
 */
export async function getOrderFormDetails(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
    try {
        const { orderFormId } = ctx.query

        const order_id = Array.isArray(orderFormId) ? orderFormId[0] : orderFormId

        if (!order_id) {
            ctx.status = 400
            ctx.body = { message: 'Missing required query parameter: orderFormId.' }
            return
        }

        // Fetch data using the OrderFormClient
        const client = ctx.clients.orderFormClient
        const response = await client.getOrderForm(order_id)

        ctx.status = 200
        ctx.body = response
    } catch (error) {
        console.error('Error fetching order form details:', error)
        ctx.status = 500
        ctx.body = { message: 'Failed to fetch order form details.', error: error.message }
    }

    await next()
}
