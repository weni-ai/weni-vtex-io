import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Middleware to retrieve skill metrics from the Insights API.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function getSkillMetrics(
  ctx: ServiceContext<Clients>,
  next: () => Promise<any>
) {
  const { projectUUID, skill } = ctx.query
  const { insightsClient } = ctx.clients

  if (!projectUUID || !skill) {
    ctx.status = 400
    ctx.body = {
      message:
        'Missing required fields: projectUUID and/or skill are required.',
    }

    return
  }

  const authClient = ctx.clients.internalWeniAuthClient
  const headers = await authClient.getAuthHeaders()

  try {
    const response = await insightsClient.getSkillMetrics(
      String(projectUUID),
      String(skill),
      headers.Authorization,
      {
        start_date: ctx.query.start_date,
        end_date: ctx.query.end_date,
      }
    )

    ctx.body = response
    ctx.status = 200
  } catch (error) {
    ctx.status = (error as any).response?.status || 500
    ctx.body =
      (error as any).response?.data ||
      'An error occurred while fetching skill metrics'

    return
  }

  await next()
}
