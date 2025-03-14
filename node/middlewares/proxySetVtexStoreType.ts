import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Middleware to proxy VTEX store type updates to the Commerce backend.
 * Receives the request payload and forwards it to the Django API.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function proxySetVtexStoreType(
  ctx: ServiceContext<Clients>,
  next: () => Promise<any>
) {
  try {
    const requestBody = await json(ctx.req)

    const { projectUUID, vtexStoreType } = requestBody

    if (!projectUUID || !vtexStoreType) {
      ctx.status = 400
      ctx.body = {
        message:
          'Missing required fields - required: projectUUID, vtexStoreType',
        body: requestBody,
      }

      return
    }

    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    if (!headers?.Authorization) {
      throw new Error('Failed to retrieve authentication token')
    }

    const data = { vtex_store_type: vtexStoreType }
    const { commerceClient } = ctx.clients
    const response = await commerceClient.setVtexStoreType(
      projectUUID,
      data,
      headers.Authorization
    )

    ctx.status = typeof response?.status === 'number' ? response.status : 200
    ctx.body = response?.data ?? {
      message: 'VTEX store type updated successfully',
    }
  } catch (error) {
    ctx.status =
      typeof error.response?.status === 'number' ? error.response.status : 500
    ctx.body = {
      message: 'Failed to update VTEX store type',
      error: error.message ?? 'Internal server error',
    }
  }

  await next()
}
