import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Middleware to check if an agent builder exists for a project
 * Communicates with the AgentBuilder client to verify existence
 */
export async function checkAgentBuilder(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  const { projectUUID } = ctx.query

  if (!projectUUID) {
    ctx.status = 400
    ctx.body = { message: 'Project UUID is required' }

    return
  }

  // Converting projectUUID to string if it's an array
  const projectUUIDString = Array.isArray(projectUUID)
    ? projectUUID[0]
    : projectUUID

  try {
    // Use the InternalWeniAuthClient from the context's clients
    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    // Use the AgentBuilderClient from the context's clients
    const agentBuilder = ctx.clients.agentBuilderClient

    const response = await agentBuilder.checkAgentBuilder(
      projectUUIDString,
      headers.Authorization
    )

    ctx.status = 200
    ctx.body = response
  } catch (error) {
    ctx.status = error.response?.status || 500
    ctx.body = error.response?.data || { message: 'Internal server error' }
  }

  await next()
}
