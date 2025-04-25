import type { ServiceContext } from '@vtex/api'
import { json } from 'co-body'

import type { Clients } from '../clients'

/**
 * Middleware to proxy the Weni WebChat integration request.
 * First creates the WebChat app and then configures it.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function proxyWeniWebChatIntegration(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  try {
    const requestBody = await json(ctx.req)

    const { projectUuid, config } = requestBody

    if (!projectUuid) {
      ctx.status = 400
      ctx.body = {
        message: 'Missing required field: projectUuid.',
        error: 'Missing required field: projectUuid.',
      }

      return
    }

    // Validate if config exists and has the title property
    if (!config || !config.title) {
      ctx.status = 400
      ctx.body = {
        message: 'Missing required field: config.title.',
        error: 'Missing required field: config.title.',
      }

      return
    }

    // Get the authentication token from InternalWeniAuthClient
    const authClient = ctx.clients.internalWeniAuthClient
    const headers = await authClient.getAuthHeaders()
    const { integrationEngineClient } = ctx.clients

    // Step 1: Create the WebChat app with just the projectUuid
    const createResponse = await integrationEngineClient.createWebChatApp(
      { project_uuid: projectUuid },
      headers.Authorization
    )

    // Extract the UUID from the creation response
    const appUuid = (createResponse as { uuid: string }).uuid

    if (!appUuid) {
      throw new Error('Failed to get app UUID from creation response')
    }

    // Step 2: Configure the WebChat app with the config and app UUID
    const configureResponse = await integrationEngineClient.configureWebChatApp(
      {
        config,
      },
      headers.Authorization,
      appUuid,
      projectUuid
    )

    ctx.status = 200
    ctx.body = {
      ...(typeof configureResponse === 'object' ? configureResponse : {}),
      appUuid,
    }

    await next()
  } catch (error) {
    console.error('Error in proxyWeniWebChatIntegration:', error)

    const axiosError = error as {
      response?: {
        status?: number
        data?: unknown
      }
      message?: string
    }

    ctx.status = axiosError?.response?.status ?? 500

    ctx.body = {
      message: 'Failed to process WebChat integration.',
      error:
        axiosError?.response?.data ??
        axiosError?.message ??
        'Internal server error.',
    }
  }
}
