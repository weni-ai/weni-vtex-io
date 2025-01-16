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
  const { project_uuid, store, flows_channel_uuid, wpp_cloud_app_uuid } = await json(ctx.req)
  const commerceClient = ctx.clients.commerceClient

  // Validate that all required fields are provided
  if (!project_uuid || !store || !flows_channel_uuid || !wpp_cloud_app_uuid) {
    ctx.status = 400
    ctx.body = { message: 'Missing required fields: project_uuid, store, flows_channel_uuid, or wpp_cloud_app_uuid' }
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
    project_uuid
  )

  // Check if there are no features available for integration
  if (!featureList.results || featureList.results.length === 0) {
    ctx.body = { message: 'No features available for integration' }
    ctx.status = 200
    return
  }

  // Iterate over each feature and integrate it with the specified project
  for (const feature of featureList.results) {
    await commerceClient.integrateFeature(
      feature.feature_uuid,
      project_uuid,
      store,
      flows_channel_uuid,
      wpp_cloud_app_uuid,
      headers.Authorization
    )

    console.log(`Integration result for feature ${feature.feature_uuid}:`)
  }

  // Set successful response message
  ctx.body = { message: 'Features integrated successfully' }
  ctx.status = 200
  await next()
}
