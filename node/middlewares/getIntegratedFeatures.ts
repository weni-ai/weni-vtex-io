import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Middleware to retrieve all integrated features for a specific project.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getIntegratedFeaturesList(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  try {
    const { projectUUID } = ctx.query
    const commerceClient = ctx.clients.commerceClient
    const projectUUIDString = Array.isArray(projectUUID) ? projectUUID[0] : projectUUID

    if (!projectUUIDString) {
      ctx.status = 400
      ctx.body = { message: 'Project UUID is required' }
      return
    }

    // Use the InternalWeniAuthClient from the context's clients
    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    // Fetch all integrated features from commerce
    const response = await commerceClient.getIntegratedFeatures(
      {
        category: 'ACTIVE',
        can_vtex_integrate: 'true'
      },
      headers.Authorization,
      projectUUIDString
    )

    ctx.body = {
      message: 'Integrated features',
      integratedFeatures: response.results || [],
      store_type: response.store_type,
    }

    ctx.status = 200
  } catch (error) {
    console.error('Error fetching integrated features:', error)
    ctx.body = { message: 'Error fetching integrated features', error: error.message }
    ctx.status = 500
  }

  await next()
}
