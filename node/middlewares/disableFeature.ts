import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Middleware to disable a single feature into a project.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function disableFeature(
  ctx: ServiceContext<Clients>,
  next: () => Promise<any>
) {
  try {
    const requestBody = await json(ctx.req)

    // Extract required fields
    const {
      project_uuid: projectUuid,
      feature_uuid: featureUuid,
      is_nexus_agent: isNexusAgent,
      agent_uuid: agentUuid,
    } = requestBody

    const { commerceClient } = ctx.clients

    // Validate required field
    if (!projectUuid) {
      ctx.status = 400
      ctx.body = {
        message: 'Missing required field: project_uuid',
      }

      return
    }

    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    // Check if it's a Nexus agent and handle accordingly
    if (isNexusAgent && agentUuid) {
      // Disable Nexus agent specifically
      const response = await commerceClient.disableNexusAgent(
        {
          project_uuid: projectUuid,
          agent_uuid: agentUuid,
        },
        headers.Authorization
      )

      const safeResponse = {
        status: response?.status,
        statusText: response?.statusText,
      }

      ctx.body = {
        message: `Nexus agent ${agentUuid} disabled successfully`,
        response: safeResponse,
      }
      ctx.status = 200

      return
    }

    // Validate required field: feature_uuid
    if (!featureUuid) {
      ctx.status = 400
      ctx.body = {
        message: 'Missing required field: feature_uuid',
      }

      return
    }

    // Disable the specific feature (original flow)
    const response = await commerceClient.disableFeature(
      projectUuid,
      featureUuid,
      headers.Authorization
    )

    ctx.vtex.logger.info(`Feature ${featureUuid} disabled successfully`)

    const safeResponse = {
      status: response?.status,
      statusText: response?.statusText,
    }

    ctx.body = {
      message: `Feature ${featureUuid} disabled successfully`,
      response: safeResponse,
    }

    ctx.status = 200
  } catch (error) {
    console.error('Error disabling feature:', error)
    ctx.body = { message: 'Error disabling feature', error: error.message }
    ctx.status = 500
  }

  await next()
}
