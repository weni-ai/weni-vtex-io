import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

/**
 * Middleware to update a single feature into a project.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function updateFeatureSettings(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  // Parse request body
  const requestBody = await json(ctx.req)

  // Extract required fields
  const { project_uuid, feature_uuid, integration_settings, ...dynamicFields } = requestBody
  const commerceClient = ctx.clients.commerceClient

  // Validate required fields
  if (!project_uuid || !feature_uuid || !integration_settings) {
    ctx.status = 400
    ctx.body = { message: 'Missing required fields: project_uuid, feature_uuid or integration_settings' }
    return
  }

  const authClient = ctx.clients.internalWeniAuthClient
  const headers = await authClient.getAuthHeaders()

  // Prepare full integration payload
  const integrationPayload = {
    project_uuid,
    integration_settings: {
      ...integration_settings
    },
    ...dynamicFields // Pass all additional fields dynamically
  }

  // Update the specific feature with all dynamic fields
  await commerceClient.updateFeatureSettings(
    feature_uuid,
    integrationPayload,
    headers.Authorization
  )

  ctx.body = { message: `Feature ${feature_uuid} updated successfully`, payload: integrationPayload }
  ctx.status = 200
  await next()
}
