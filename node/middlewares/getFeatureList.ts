import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Middleware to retrieve all available features for a specific project.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getFeatureList(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  try {
    const { projectUUID } = ctx.query
    const { commerceClient } = ctx.clients

    const projectUUIDString = Array.isArray(projectUUID)
      ? projectUUID[0]
      : projectUUID

    if (!projectUUIDString) {
      ctx.status = 400
      ctx.body = { message: 'Project UUID is required' }

      return
    }

    // Use the InternalWeniAuthClient from the context's clients
    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    // Fetch all available features from commerce
    const response = await commerceClient.getFeatures(
      {
        category: 'ACTIVE',
        can_vtex_integrate: 'true',
        nexus_agents: 'true',
      },
      headers.Authorization,
      projectUUIDString
    )

    ctx.body = {
      message: 'Features available for integration',
      features: response.results || [],
      agents: response.nexus_agents,
      store_type: response.store_type,
    }

    ctx.status = 200
  } catch (error) {
    console.error('Error fetching feature list:', error)
    ctx.body = { message: 'Error fetching feature list', error: error.message }
    ctx.status = 500
  }

  await next()
}
