import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

/**
 * Middleware to integrate all available features for a project.
 * 
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function integrateAvailableFeatures(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  // Parse request body
  const requestBody = await json(ctx.req)

  // Extract required fields
  const { project_uuid, flows_channel_uuid, wpp_cloud_app_uuid, ...dynamicFields } = requestBody
  const commerceClient = ctx.clients.commerceClient

  // Validate required fields
  if (!project_uuid || !flows_channel_uuid || !wpp_cloud_app_uuid) {
    ctx.status = 400
    ctx.body = { message: 'Missing required fields: project_uuid, flows_channel_uuid, or wpp_cloud_app_uuid' }
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

  // Iterate over each feature UUID and integrate, passing all dynamic fields
  for (const feature of featureList.results) {
    const integrationPayload = {
      project_uuid,
      flows_channel_uuid,
      wpp_cloud_app_uuid,
      ...dynamicFields, // Pass all additional fields dynamically
    }

    await commerceClient.integrateFeature(
      feature.feature_uuid,
      integrationPayload,
      headers.Authorization
    )

    console.log(`Integrated feature: ${feature.feature_uuid} with payload:`, integrationPayload)
  }

  // Set successful response message
  ctx.body = { message: 'Features integrated successfully' }
  ctx.status = 200
  await next()
}
