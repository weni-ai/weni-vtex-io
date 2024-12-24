import { ServiceContext } from '@vtex/api'
import { Clients } from '../clients'

export async function createAgentBuilder(ctx: ServiceContext<Clients>, next: () => Promise<any>) {
    const { projectUUID } = ctx.query;
    const agentBuilderClient = ctx.clients.agentBuilderClient;
    const projectUUIDString = Array.isArray(projectUUID) ? projectUUID[0] : projectUUID;

    if (!projectUUIDString) {
        ctx.status = 400;
        ctx.body = { message: 'Project UUID is required'};
    }

    const authClient = ctx.clients.internalWeniAuthClient;
    const headers = await authClient.getAuthHeaders();
    let agent = new Map<string, string>();
    agent.set("name", ctx.params.agent["name"]);
    agent.set("occupation", ctx.params.agent["occupation"]);
    agent.set("objective", ctx.params.agent["objective"]);

    const body = {
        "agent": agent,
        "links": [
            ctx.params.links[0]
        ]
    }
    const response = await agentBuilderClient.createAgentBuilder(
        headers.Authorization,
        projectUUIDString,
        body
    );

    if (response.results) {
        ctx.body = { message: "Agent builder created: ", response};
    }
    ctx.status = 200;
    await next();
}
