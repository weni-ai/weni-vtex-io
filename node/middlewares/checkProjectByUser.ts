import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Middleware to check if a project exists for a given user in Weni Engage.
 * Uses the EngageClient to verify project existence.
 *
 * @param ctx - VTEX IO service context
 * @param next - Next middleware function
 */
export async function checkProjectByUser(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  // Get the VTEX account and user email from the headers
  const vtexAccount = ctx.header['x-vtex-account'] as string
  const userEmail = ctx.header['x-vtex-caller'] as string

  try {
    // Use the InternalWeniAuthClient from the context's clients
    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()
    // Use the EngageClient from the context's clients
    const { engageClient } = ctx.clients

    const response = await engageClient.checkProject(
      vtexAccount,
      userEmail,
      headers.Authorization
    )

    ctx.status = 200
    ctx.body = response
  } catch (err) {
    // Type assertion to handle 'err' as an Error object
    const error = err as Error

    ctx.status = (error as any).response?.status
      ? Number((error as any).response.status)
      : 500 // Ensure status is a number
    ctx.body = {
      message: 'Error checking user project',
      error: (error as any).response?.data ?? error.message ?? 'Unknown error',
    }
  }

  await next()
}
