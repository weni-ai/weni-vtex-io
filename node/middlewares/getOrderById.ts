/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

export async function getOrderById(
  ctx: ServiceContext<Clients>,
  next: () => Promise<any>
) {
  try {
    const { orderId } = ctx.query

    // Ensure orderId is a string
    if (!orderId || typeof orderId !== 'string') {
      ctx.status = 400
      ctx.body = { message: 'Missing or invalid query parameter: orderId.' }

      return
    }

    const client = ctx.clients.omsClient
    const response = await client.getOrderById(orderId)

    ctx.status = 200
    ctx.body = response
  } catch (error) {
    console.error('Error fetching orders by orderId:', error)
    ctx.status = 500
    ctx.body = {
      message: 'Failed to fetch orders by orderId.',
      error: error.message,
    }
  }

  await next()
}
