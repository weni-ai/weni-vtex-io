import { Context } from 'koa'
import { InternalWeniAuthClient } from '../clients/InternalWeniAuthClient'

/**
 * Middleware to retrieve a list of available features for a specific project that can integrate with VTEX.
 * 
 * @param ctx - Koa context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getFeatureList(ctx: Context, next: () => Promise<any>) {
  const { projectUUID } = ctx.query // Obtaining the projectUUID from query parameters
  const commerceClient = ctx.clients.commerceClient // Accessing commerceClient without "new"

  if (!projectUUID) {
    ctx.status = 400
    ctx.body = { message: 'Project UUID is required' }
    return
  }

  // Instantiate the InternalWeniAuthClient to get the authorization token
  const authClient = new InternalWeniAuthClient(ctx.vtex)
  const headers = await authClient.getAuthHeaders()

  // Call CommerceClient's getFeatures method with the retrieved token and project UUID
  const response = await commerceClient.getFeatures(
    {
      category: 'ACTIVE',
      can_vtex_integrate: 'true',
    },
    headers.Authorization,
    projectUUID
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
