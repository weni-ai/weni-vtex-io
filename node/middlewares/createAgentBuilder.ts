import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

/**
 * Middleware to create a agent builder in Weni Nexus
 * Retrieves an authentication token using InternalWeniAuthClient and forwards
 * the data to the Weni Nexus API.
 *
 * @param ctx - VTEX IO context object.
 * @param next - Function to proceed to the next middleware.
 */
export async function createAgentBuilder(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
    // Extracting projectUUID from query params
    const { projectUUID } = ctx.query;
    const agentBuilderClient = ctx.clients.agentBuilderClient;
    // Ensuring projectUUID is a string
    const projectUUIDString = Array.isArray(projectUUID) ? projectUUID[0] : projectUUID;

    // Validating if exists projectUUID
    if (!projectUUIDString) {
        ctx.status = 400;
        ctx.body = { message: 'Project UUID is required' };
        return;
    }
    const authClient = ctx.clients.internalWeniAuthClient;
    const headers = await authClient.getAuthHeaders();

    const requestBody = await json(ctx.req)
    const { agent, links } = requestBody;
    const final_agent = {
        "name": agent.name,
        "goal": agent.objective,
        "role": agent.occupation,
        "personality": "Amigável"
    }
    console.log(final_agent)
    // Setting the body for request to nexus module
    const body = {
        "agent": final_agent,
        "links": links
    }
    console.log(body)
    const response = await agentBuilderClient.createAgentBuilder(
        body,
        headers.Authorization,
        projectUUIDString,
    );
    console.log(response)
    // Checking response have success
    if (response.results) {
        ctx.body = { message: "Agent builder created: ", response };
    }
    ctx.status = 200;
    await next();
}
