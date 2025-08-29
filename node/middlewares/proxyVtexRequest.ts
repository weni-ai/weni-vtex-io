import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Handles dynamic HTTP proxy requests to internal VTEX APIs.
 *
 * This middleware receives a request body containing all necessary information
 * to build and execute an HTTP request to internal VTEX endpoints (e.g., method, path, headers, query params, body).
 * It uses VtexGenericClient to forward the request to the target VTEX API and returns the response.
 *
 * Expected request body:
 * {
 *   "method": "GET" | "POST" | "PUT" | "PATCH",
 *   "path": "/api/oms/pvt/orders",
 *   "headers": { "Custom-Header": "value" },
 *   "params": { "queryParam": "value" },
 *   "data": { "key": "value" }
 * }
 *
 * Response:
 * - Forwards the status code and body from the VTEX API response.
 * - On error, returns 500 or the error's response status with its message.
 *
 * Example:
 * ```json
 * POST /_v/proxy-vtex
 * Content-Type: application/json
 *
 * {
 *   "method": "GET",
 *   "path": "/api/oms/pvt/orders",
 *   "params": { "f_Status": "ready-for-handling" }
 * }
 * ```
 */
export async function proxyVtexRequest(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  try {
    const { path, method, headers, data, params } = await json(ctx.req)

    if (!path || !method) {
      ctx.status = 400
      ctx.body = {
        message: 'Missing required fields: path and method are mandatory.',
      }

      return
    }

    const requestConfig = {
      method,
      path,
      headers,
      data,
      params,
    }

    const response = await ctx.clients.vtexGeneric.requestVtex(requestConfig)

    ctx.status = Number(response.status) || 200 // Ensure status is a number
    ctx.body = response.data
  } catch (err) {
    // Type assertion to handle 'err' as an Error object
    const error = err as Error

    console.error('proxyVtexRequest error:', error)

    ctx.status = (error as any).response?.status
      ? Number((error as any).response.status)
      : 500 // Ensure status is a number
    ctx.body = {
      message: 'Failed to proxy VTEX request',
      error: (error as any).response?.data ?? error.message ?? 'Unknown error',
    }
  }

  await next()
}
