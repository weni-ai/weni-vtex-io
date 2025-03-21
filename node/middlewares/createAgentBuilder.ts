import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Middleware to create an agent builder in Weni Nexus
 * Retrieves an authentication token using InternalWeniAuthClient and forwards
 * the data to the Weni Nexus API.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function createAgentBuilder(
  ctx: ServiceContext<Clients>,
  next: () => Promise<any>
) {
  try {
    // Extracting projectUUID from query params
    const { projectUUID } = ctx.query
    const { agentBuilderClient } = ctx.clients

    // Ensuring projectUUID is a string
    const projectUUIDString = Array.isArray(projectUUID)
      ? projectUUID[0]
      : projectUUID

    // Validating if projectUUID exists
    if (!projectUUIDString) {
      ctx.status = 400
      ctx.body = { message: 'Project UUID is required' }

      return
    }

    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()

    const requestBody = await json(ctx.req)
    const { agent, links } = requestBody
    const finalAgent = {
      name: agent.name,
      goal: agent.objective,
      role: agent.occupation,
      personality: 'Amigável',
    }

    // Setting the body for request to nexus module
    const body = {
      agent: finalAgent,
      links,
    }

    const response = await agentBuilderClient.createAgentBuilder(
      body,
      headers.Authorization,
      projectUUIDString
    )

    ctx.status = typeof response?.status === 'number' ? response.status : 200
    ctx.body = response?.data ?? {
      message: 'Agent builder created successfully',
    }
  } catch (error) {
    ctx.status =
      typeof (error as any).response?.status === 'number'
        ? (error as any).response.status
        : 500
    ctx.body = {
      message: 'Failed to create agent builder',
      error: (error as any).message ?? 'Internal server error',
    }
  }

  await next()
}
