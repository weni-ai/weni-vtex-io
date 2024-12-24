import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

/**
 * Client for interacting with the Agent Builder module to add a artificial intelligent agent.
 * Handles internal authentication and environment-specific configurations.
 */
export class AgentBuilderClient extends ExternalClient {
    constructor(context: IOContext, options?: InstanceOptions) {
        const baseUrl = process.env.AGENT_BUILDER__BASE_URL;
        if (!baseUrl) {
            throw new Error('AGENT_BUILDER_BASE_URL is not defined');
        }
        super(baseUrl, context, {
            ...options,
            headers: {
                ...(options?.headers ?? {}),
                'Content-Type': 'application/json'
            },
            timeout: 15000,
        })
    }

    public async createAgentBuilder(
        token: string,
        projectUUID: string,
        params: {agent: Map<string, string>, links: Array<string>}
    ): Promise<any> {
        const url = `api/${projectUUID}/commerce-router/`;
        return this.http.post(
            url, {
            headers: {
                Authorization: `${token}`,
            },
            params,
        })
    }
}
