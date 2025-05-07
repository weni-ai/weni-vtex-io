import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Middleware to integrate all available features for a project.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function integrateAvailableFeatures(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  // Parse request body
  const requestBody = await json(ctx.req)

  // Extract required fields
  const {
    project_uuid: projectUuid,
    flows_channel_uuid: flowsChannelUuid,
    wpp_cloud_app_uuid: wppCloudAppUuid,
    ...dynamicFields
  } = requestBody

  const { commerceClient } = ctx.clients

  // Validate required fields
  if (!projectUuid || !flowsChannelUuid || !wppCloudAppUuid) {
    ctx.status = 400
    ctx.body = {
      message:
        'Missing required fields: project_uuid, flows_channel_uuid, or wpp_cloud_app_uuid',
    }

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
      nexus_agents: 'true',
    },
    headers.Authorization,
    projectUuid
  )

  // Check if there are no features available for integration
  if (!featureList.results || featureList.results.length === 0) {
    ctx.body = { message: 'No features available for integration' }
    ctx.status = 200

    return
  }

  // Create integration promises for all features
  const integrationPromises = featureList.results.map((feature: any) => {
    const integrationPayload = {
      project_uuid: projectUuid,
      flows_channel_uuid: flowsChannelUuid,
      wpp_cloud_app_uuid: wppCloudAppUuid,
      ...dynamicFields, // Pass all additional fields dynamically
    }

    return commerceClient.integrateFeature(
      feature.feature_uuid,
      integrationPayload,
      headers.Authorization
    )
  })

  // Execute all integrations in parallel
  await Promise.all(integrationPromises)

  // Set successful response message
  ctx.body = { message: 'Features integrated successfully' }
  ctx.status = 200
  await next()
}
