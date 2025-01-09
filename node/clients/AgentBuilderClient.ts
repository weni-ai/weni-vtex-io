import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

import { AGENT_BUILDER_BASE_URL } from '../env'

/**
 * Client for interacting with the Agent Builder module to add a artificial intelligent agent.
 * Handles internal authentication and environment-specific configurations.
 */
export class AgentBuilderClient extends ExternalClient {
    constructor(context: IOContext, options?: InstanceOptions) {
        const baseUrl = AGENT_BUILDER_BASE_URL;
        if (!baseUrl) {
            throw new Error('AGENT_BUILDER_BASE_URL is not defined');
        }
        super(baseUrl, context, {
            ...options,
            headers: {
                ...(options?.headers ?? {}),
                'Content-Type': 'application/json'
            },
            timeout: 60000,
        })
    }

    public async createAgentBuilder(
        data: Record<string, any>,
        token: string,
        projectUUID: string,
    ): Promise<any> {
        const url = `/api/${projectUUID}/commerce-router/`;

        return this.http.post(
            url, data, {
            headers: {
                Authorization: `${token}`
            },
            
        })
    }
}
