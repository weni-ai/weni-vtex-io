import { ServiceContext } from '@vtex/api'
import type { Clients } from '../clients'

/**
 * Middleware to fetch orders by email.
 */
export async function getOrdersByEmail(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  try {
    const { user_email } = ctx.query

    const email = Array.isArray(user_email) ? user_email[0] : user_email

    if (!email) {
      ctx.status = 400
      ctx.body = { message: 'Missing required query parameter: user_email.' }
      return
    }

    const queryParams = {
      'q': email,
      'orderBy': 'creationDate,desc',
    }

    const client = ctx.clients.omsClient
    const response = await client.getOrders(queryParams)

    ctx.status = 200
    ctx.body = response
  } catch (error) {
    console.error('Error fetching orders by email:', error, ctx.query)
    ctx.status = (error as any).response?.status || 500
    ctx.body = (error as any).response?.data || 'An error occurred while fetching orders by email'
  }

  await next()
}
