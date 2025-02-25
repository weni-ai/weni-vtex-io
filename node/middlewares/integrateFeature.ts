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
  next: () => Promise<any>
) {
  try {
    // Parse request body
    const requestBody = await json(ctx.req)

    // Extract required fields
    const {
      project_uuid,
      flows_channel_uuid,
      wpp_cloud_app_uuid,
      feature_uuid,
      ...dynamicFields
    } = requestBody

    const { commerceClient } = ctx.clients

    // Validate required fields
    if (
      !project_uuid ||
      !flows_channel_uuid ||
      !wpp_cloud_app_uuid ||
      !feature_uuid
    ) {
      ctx.status = 400
      ctx.body = {
        message:
          'Missing required fields: project_uuid, flows_channel_uuid, wpp_cloud_app_uuid, or feature_uuid',
      }

      return
    }

    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    // Prepare full integration payload
    const integrationPayload = {
      project_uuid,
      flows_channel_uuid,
      wpp_cloud_app_uuid,
      ...dynamicFields, // Pass all additional fields dynamically
    }

    // Integrate the specific feature with all dynamic fields
    await commerceClient.integrateFeature(
      feature_uuid,
      integrationPayload,
      headers.Authorization
    )

    console.log(
      `Integrated feature: ${feature_uuid} with payload:`,
      integrationPayload
    )

    ctx.body = {
      message: `Feature ${feature_uuid} integrated successfully`,
      payload: integrationPayload,
    }
    ctx.status = 200
  } catch (error) {
    console.error('Error integrating feature:', error)
    ctx.body = { message: 'Error integrating feature', error: error.message }
    ctx.status = 500
  }

  await next()
}
