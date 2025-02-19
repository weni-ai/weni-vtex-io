import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Middleware to check WhatsApp integration
 * Uses IntegrationEngineClient to verify if integration exists
 * for the specified project
 *
 * @param ctx - VTEX IO service context
 * @param next - Function to proceed to next middleware
 */
export async function checkWhatsAppIntegration(
  ctx: ServiceContext<Clients>,
  next: () => Promise<any>
) {
  const { projectUUID } = ctx.query
  const { integrationEngineClient } = ctx.clients
  const authClient = ctx.clients.internalWeniAuthClient

  // Validating if projectUUID exists
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
    const headers = await authClient.getAuthHeaders()

    // Checking if WhatsApp integration exists
    const whatsappResponse =
      await integrationEngineClient.checkWhatsAppIntegration(
        projectUUIDString,
        headers.Authorization
      )

    ctx.status = 200
    ctx.body = whatsappResponse

    await next()
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error checking WhatsApp integration:', {
        message: error.message,
        stack: error.stack,
        response: (error as any).response?.data || 'No response data',
      })

      ctx.status = (error as any).response?.status || 500
      ctx.body = {
        message: 'Error checking WhatsApp integration',
        error: error.message,
        details: (error as any).response?.data || 'No additional details',
      }
    } else {
      ctx.status = 500
      ctx.body = {
        message: 'Unknown error checking WhatsApp integration',
      }
    }
  }
}
