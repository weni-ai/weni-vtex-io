import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Middleware to integrate a single feature into a project.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function integrateFeature(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  try {
    // Parse request body
    const requestBody = await json(ctx.req)

    // Extract required fields
    const {
      project_uuid: projectUuid,
      flows_channel_uuid: flowsChannelUuid,
      wpp_cloud_app_uuid: wppCloudAppUuid,
      feature_uuid: featureUuid,
      is_nexus_agent: isNexusAgent,
      agent_uuid: agentUuid,
      ...dynamicFields
    } = requestBody

    const { commerceClient } = ctx.clients

    // Validate required fields
    if (!projectUuid) {
      ctx.status = 400
      ctx.body = {
        message: 'Missing required field: project_uuid',
      }

      return
    }

    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    if (isNexusAgent && agentUuid) {
      const integrationResponse = await commerceClient.integrateNexusAgent(
        {
          project_uuid: projectUuid,
          agent_uuid: agentUuid,
        },
        headers.Authorization
      )

      ctx.body = {
        message: `Nexus Agent ${agentUuid} integrated successfully`,
        response: integrationResponse,
      }
      ctx.status = 200

      return
    }

    if (!flowsChannelUuid || !wppCloudAppUuid || !featureUuid) {
      ctx.status = 400
      ctx.body = {
        message:
          'Missing required fields: project_uuid, flows_channel_uuid, wpp_cloud_app_uuid, or feature_uuid',
      }

      return
    }

    // Prepare full integration payload
    const integrationPayload = {
      project_uuid: projectUuid,
      flows_channel_uuid: flowsChannelUuid,
      wpp_cloud_app_uuid: wppCloudAppUuid,
      ...dynamicFields, // Pass all additional fields dynamically
    }

    // Integrate the specific feature with all dynamic fields
    await commerceClient.integrateFeature(
      featureUuid,
      integrationPayload,
      headers.Authorization
    )

    ctx.vtex.logger.info(
      `Integrated feature: ${featureUuid} with payload: ${JSON.stringify(
        integrationPayload
      )}`
    )

    ctx.body = {
      message: `Feature ${featureUuid} integrated successfully`,
      payload: integrationPayload,
    }
    ctx.status = 200
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    ctx.vtex.logger.error(`Error integrating feature: ${errorMessage}`)
    ctx.body = { message: 'Error integrating feature', error: errorMessage }
    ctx.status = 500
  }

  await next()
}
