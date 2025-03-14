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
    const final_agent = {
      name: agent.name,
      goal: agent.objective,
      role: agent.occupation,
      personality: 'Amigável',
    }

    // Setting the body for request to nexus module
    const body = {
      agent: final_agent,
      links,
    }

    const response = await agentBuilderClient.createAgentBuilder(
      body,
      headers.Authorization,
      projectUUIDString
    )

    // Checking response for success
    if (response.results) {
      ctx.body = { message: 'Agent builder created:', response }
      ctx.status = 200
    } else {
      ctx.body = { message: 'Failed to create agent builder', response }
      ctx.status = 500
    }
  } catch (error) {
    console.error('Error creating agent builder:', error)
    ctx.body = { message: 'Error creating agent builder', error: error.message }
    ctx.status = 500
  }

  await next()
}
