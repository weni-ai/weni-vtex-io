import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'

/**
 * Middleware to retrieve all available features for a specific project.
 * 
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getFeatureList(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
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

  // Fetch all available features from commerce
  const response = await commerceClient.getFeatures(
    {
      category: 'ACTIVE',
      can_vtex_integrate: 'true',
    },
    headers.Authorization,
    projectUUIDString
  )

  ctx.body = {
    message: 'Features available for integration',
    features: response.results || []
  }

  ctx.status = 200
  await next()
}
