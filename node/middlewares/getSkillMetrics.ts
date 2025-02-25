import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'

/**
 * Middleware to retrieve skill metrics from the Insights API.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getSkillMetrics(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
  const { projectUUID, skill } = ctx.query
  const insightsClient = ctx.clients.insightsClient

  if (!projectUUID || !skill) {
    ctx.status = 400
    ctx.body = { message: 'Missing required fields: projectUUID or skill' }
    return
  }

  const authClient = ctx.clients.internalWeniAuthClient
  const headers = await authClient.getAuthHeaders()

  const response = await insightsClient.getSkillMetrics(
    String(projectUUID),
    String(skill),
    headers.Authorization,
    {
      ...ctx.query
    }
  )

  ctx.body = response
  ctx.status = 200
  await next()
}
