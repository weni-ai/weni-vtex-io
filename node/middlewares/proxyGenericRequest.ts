import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Handles dynamic HTTP proxy requests to external APIs with authentication.
 *
 * This middleware receives a request body containing all necessary information
 * to build and execute an HTTP request (e.g., method, url, headers, query params, body).
 * It authenticates using InternalWeniAuthClient, forwards the request using
 * GenericExternalHttpClient, and returns the response from the target API.
 *
 * Expected request body:
 * {
 *   "method": "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
 *   "url": "https://external.api/endpoint",
 *   "headers": { "Custom-Header": "value" },
 *   "params": { "queryParam": "value" },
 *   "data": { "key": "value" },
 *   "timeout": 5000
 * }
 *
 * Response:
 * - Forwards the status code and body from the external API response.
 * - On error, returns 500 or the error's response status with its message.
 *
 * Example:
 * ```json
 * POST /_v/proxy-request
 * Content-Type: application/json
 *
 * {
 *   "method": "GET",
 *   "url": "https://api.example.com/items",
 *   "params": { "category": "shoes" }
 * }
 * ```
 */
export async function proxyGenericRequest(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  try {
    const { url, method, headers, data, params, timeout } = await json(ctx.req)

    if (!url || !method) {
      ctx.status = 400
      ctx.body = {
        message: 'Missing required fields: url and method are mandatory.',
      }

      return
    }

    const authHeaders =
      await ctx.clients.internalWeniAuthClient.getAuthHeaders()

    const requestConfig = {
      url,
      method,
      headers: {
        ...headers,
        ...authHeaders,
      },
      data,
      params,
      timeout,
    }

    const response = await ctx.clients.genericHttp.requestGeneric(requestConfig)

    ctx.status = Number(response.status) || 200 // Ensure status is a number
    ctx.body = response.data
  } catch (err) {
    // Type assertion to handle 'err' as an Error object
    const error = err as Error

    console.error('proxyGenericRequest error:', error)

    ctx.status = (error as any).response?.status
      ? Number((error as any).response.status)
      : 500 // Ensure status is a number
    ctx.body = {
      message: 'Failed to proxy request',
      error: (error as any).response?.data ?? error.message ?? 'Unknown error',
    }
  }

  await next()
}
