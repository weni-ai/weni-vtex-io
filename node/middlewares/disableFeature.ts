import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

/**
 * Middleware to disable a single feature into a project.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function disableFeature(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  try {
    const requestBody = await json(ctx.req)

    // Extract required fields
    const { project_uuid, feature_uuid } = requestBody
    const commerceClient = ctx.clients.commerceClient

    console.log(project_uuid, feature_uuid)

    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    // Disable the specific feature with all dynamic fields
    await commerceClient.disableFeature(
      project_uuid,
      feature_uuid,
      headers.Authorization
    )

    ctx.body = { message: `Feature ${feature_uuid} deleted successfully` }
    ctx.status = 200
  } catch (error) {
    console.error('Error disabling feature:', error)
    ctx.body = { message: 'Error disabling feature', error: error.message }
    ctx.status = 500
  }

  await next()
}
