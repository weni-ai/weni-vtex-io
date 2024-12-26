import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'
import { json } from 'co-body'

export async function createAgentBuilder(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
    const { projectUUID } = ctx.query;
    const agentBuilderClient = ctx.clients.agentBuilderClient;
    const projectUUIDString = Array.isArray(projectUUID) ? projectUUID[0] : projectUUID;

    if (!projectUUIDString) {
        ctx.status = 400;
        ctx.body = { message: 'Project UUID is required'};
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
    const body = {
        "agent": final_agent,
        "links": links
    }
    const response = await agentBuilderClient.createAgentBuilder(
        body,
        headers.Authorization,
        projectUUIDString,
    );

    if (response.results) {
        ctx.body = { message: "Agent builder created: ", response};
    }
    ctx.status = 200;
    await next();
}
