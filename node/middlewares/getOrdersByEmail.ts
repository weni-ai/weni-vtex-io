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

    const client = ctx.clients.omsClient
    const response = await client.getOrdersByEmail(email)

    ctx.status = 200
    ctx.body = response
  } catch (error) {
    console.error('Error fetching orders by email:', error)
    ctx.status = 500
    ctx.body = { message: 'Failed to fetch orders by email.', error: error.message }
  }

  await next()
}
