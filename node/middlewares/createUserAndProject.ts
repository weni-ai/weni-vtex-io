import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

/**
 * Middleware to create a user, project, and organization in Weni Engage.
 * Retrieves an authentication token using InternalWeniAuthClient and forwards
 * the data to the Weni Engage API.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function createUserAndProject(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
    try {
        // Parse the request body
        const requestBody = await json(ctx.req)
        const { user_email, organization_name, project_name, vtex_account } = requestBody

        // Validate required fields
        if (!user_email || !organization_name || !project_name || !vtex_account) {
            ctx.status = 400
            ctx.body = { message: 'Missing required fields: user_email, organization_name, project_name, vtex_account.' }
            return
        }

        // Get authentication token using InternalWeniAuthClient
        const authClient = ctx.clients.internalWeniAuthClient
        const headers = await authClient.getAuthHeaders()

        // Prepare data for Weni Engage API
        const data = {
            user_email,
            organization_name,
            project_name,
            vtex_account,
        }

        // Call EngageClient to send the request
        const engageClient = ctx.clients.engageClient
        const response = await engageClient.createUserAndProject(data, headers.Authorization)

        // Extract only the project_uuid from the response
        const projectUUID = response?.project_uuid

        if (!projectUUID) {
            throw new Error('project_uuid is missing in the Engage API response.')
        }

        // Return the extracted project_uuid
        ctx.status = 201
        ctx.body = { project_uuid: projectUUID }
    } catch (error) {
        // Log and handle errors safely
        console.error('Error while creating user, project, and organization:', error)

        // Use a type guard to safely access `error.response`
        if (typeof error === 'object' && error !== null && 'response' in error) {
            const errorResponse = error as { response: { status?: number; data?: any } }
            ctx.status = errorResponse.response?.status || 500
            ctx.body = {
                message: 'Failed to create user, project, and organization.',
                error: errorResponse.response?.data || 'Internal server error.',
            }
        } else if (error instanceof Error) {
            ctx.status = 500
            ctx.body = {
                message: 'Failed to create user, project, and organization.',
                error: error.message || 'Internal server error.',
            }
        } else {
            ctx.status = 500
            ctx.body = {
                message: 'An unknown error occurred.',
                error: 'Internal server error.',
            }
        }
    }

    await next()
}
