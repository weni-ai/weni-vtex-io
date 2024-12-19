import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

/**
 * Client for interacting with Weni Engage API.
 * Handles creating users, projects, and organizations in Weni Engage.
 */
export class EngageClient extends ExternalClient {
    constructor(ctx: IOContext, options?: InstanceOptions) {
        const baseURL =
            process.env.WENI_ENGAGE_API_BASE_URL || 'https://api.stg.cloud.weni.ai'
        super(baseURL, ctx, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers ?? {}),
            },
            timeout: options?.timeout ?? 10000,
        })
    }

    /**
     * Creates a user, project, and organization in Weni Engage.
     *
     * @param data - Payload containing user, project, and organization details.
     * @param token - Authorization token for the request.
     * @returns A promise resolving to an object containing project_uuid and organization_uuid.
     */
    public async createUserAndProject(data: Record<string, any>, token: string): Promise<any> {
        const url = '/v2/commerce/'
        return this.http.post(url, data, {
            headers: {
                Authorization: token,
            },
        })
    }
}
