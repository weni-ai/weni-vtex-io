import { IOClients } from '@vtex/api'
import { CommerceClient } from './CommerceClient'
import { InternalWeniAuthClient } from './InternalWeniAuthClient'
import { EngageClient } from './EngageClient'
import { IntegrationEngineClient } from './IntegrationEngineClient'
import { AgentBuilderClient } from './AgentBuilderClient'

export class Clients extends IOClients {
  public get commerceClient() {
    return this.getOrSet('commerceClient', CommerceClient)
  }

  public get internalWeniAuthClient() {
    return this.getOrSet('internalWeniAuthClient', InternalWeniAuthClient)
  }

  public get engageClient() {
    return this.getOrSet('engageClient', EngageClient)
  }

  public get integrationEngineClient() {
    return this.getOrSet('integrationEngineClient', IntegrationEngineClient)
  }

  public get agentBuilderClient() {
    return this.getOrSet('agentBuilderClient', AgentBuilderClient)
  }
}
