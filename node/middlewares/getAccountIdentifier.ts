import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Middleware to fetch the account identifier.
 *
 * This function attempts to retrieve the account identifier using the accountIdentifier client.
 * If successful, it sets the response status and body with the data received.
 * In case of an error, it logs the error, sets an appropriate status code, and returns an error message.
 *
 * @param ctx - The service context containing the clients and request/response objects.
 * @param next - The next middleware function in the chain.
 * @returns A promise that resolves when the middleware processing is complete.
 */
export async function getAccountIdentifier(
  ctx: ServiceContext<Clients>,
  next: () => Promise<unknown>
): Promise<void> {
  try {
    const client = ctx.clients.accountIdentifier
    const response = await client.getAccountIdentifier()

    ctx.status = response.status
    ctx.body = response.data
  } catch (error) {
    // Get the actual status from the API response, fallback to 500 only if no status is available
    const apiStatus = (error as any)?.response?.status

    ctx.status = apiStatus || 500

    let errorData: any

    try {
      errorData =
        (error as any)?.response?.data ??
        (error as any)?.message ??
        'Unknown error'
      if (typeof errorData !== 'object') {
        throw new Error()
      }
    } catch {
      errorData = { detail: String(error) }
    }

    ctx.body = {
      message: 'Failed to fetch account identifier.',
      error: errorData,
    }

    return
  }

  await next()
}
