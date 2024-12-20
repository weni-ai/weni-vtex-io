import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

/**
 * Middleware to proxy the WhatsApp Cloud integration request.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function proxyWhatsAppIntegration(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
    try {
        const requestBody = await json(ctx.req)

        // Validate the required fields
        const { project_uuid, waba_id, phone_number_id, auth_code } = requestBody
        if (!project_uuid || !waba_id || !phone_number_id || !auth_code) {
            ctx.status = 400
            ctx.body = { message: 'Missing required fields: project_uuid, waba_id, phone_number_id, auth_code.' }
            return
        }

        // Get the authentication token from InternalWeniAuthClient
        const authClient = ctx.clients.internalWeniAuthClient
        const headers = await authClient.getAuthHeaders()

        // Use the IntegrationEngineClient to create the integration
        const integrationEngineClient = ctx.clients.integrationEngineClient
        const response = await integrationEngineClient.createWhatsAppIntegration(requestBody, headers.Authorization)

        ctx.status = 201
        ctx.body = response
    } catch (error) {
        console.error('Error while proxying WhatsApp integration request:', error)

        if (error instanceof Error) {
            const customError = error as { response?: { status?: number }; message?: string }

            ctx.status = customError.response?.status || 500
            ctx.body = {
                message: 'Failed to process WhatsApp integration.',
                error: customError.message || 'Internal server error.',
            }
        } else {
            ctx.status = 500
            ctx.body = {
                message: 'Failed to process WhatsApp integration.',
                error: 'Unknown error occurred.',
            }
        }
    }

    await next()
}
