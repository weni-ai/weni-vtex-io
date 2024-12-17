import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'

/**
 * Middleware to retrieve a list of available features for a specific project that can integrate with VTEX.
 * 
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getFeatureList(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  const { projectUUID } = ctx.query // Obtaining the projectUUID from query parameters
  const commerceClient = ctx.clients.commerceClient

  // Ensure projectUUID is a string
  const projectUUIDString = Array.isArray(projectUUID) ? projectUUID[0] : projectUUID

  if (!projectUUIDString) {
    ctx.status = 400
    ctx.body = { message: 'Project UUID is required' }
    return
  }

  // Use the InternalWeniAuthClient from the context's clients
  const authClient = ctx.clients.internalWeniAuthClient
  const headers = await authClient.getAuthHeaders()

  // Call CommerceClient's getFeatures method with the retrieved token and project UUID
  const response = await commerceClient.getFeatures(
    {
      category: 'ACTIVE',
      can_vtex_integrate: 'true',
    },
    headers.Authorization,
    projectUUIDString
  )

  // Set response data and status
  if (!response.results || response.results.length === 0) {
    ctx.body = { message: 'No features available for integration.' }
  } else {
    const featuresToIntegrate = response.results.map((feature: any) => feature.feature_uuid)
    ctx.body = { message: 'Features available for integration', features: featuresToIntegrate }
  }

  ctx.status = 200
  await next()
}
