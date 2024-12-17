import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

/**
 * Middleware to integrate available features for a specific project with VTEX.
 * Retrieves a list of features and integrates each feature if available.
 * 
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function integrateAvailableFeatures(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  const { projectUUID } = await json(ctx.req)
  const commerceClient = ctx.clients.commerceClient

  // Validate that projectUUID is provided
  if (!projectUUID) {
    ctx.status = 400
    ctx.body = { message: 'Project UUID is required' }
    return
  }

  // Use the InternalWeniAuthClient from the context's clients
  const authClient = ctx.clients.internalWeniAuthClient
  const headers = await authClient.getAuthHeaders()

  // Retrieve the list of available features for integration
  const featureList = await commerceClient.getFeatures(
    {
      category: 'ACTIVE',
      can_vtex_integrate: 'true',
    },
    headers.Authorization,
    projectUUID
  )

  // Check if there are no features available for integration
  if (!featureList.results || featureList.results.length === 0) {
    ctx.body = { message: 'No features available for integration' }
    ctx.status = 200
    return
  }

  // Iterate over each feature and integrate it with the specified project
  for (const feature of featureList.results) {
    const integrationResult = await commerceClient.integrateFeature(
      feature.feature_uuid,
      projectUUID,
      headers.Authorization
    )

    console.log(`Integration result for feature ${feature.feature_uuid}:`, integrationResult)
  }

  // Set successful response message
  ctx.body = { message: 'Features integrated successfully' }
  ctx.status = 200
  await next()
}
