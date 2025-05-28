import { IOClients } from '@vtex/api'

import { CommerceClient } from './CommerceClient'
import { InternalWeniAuthClient } from './InternalWeniAuthClient'
import { EngageClient } from './EngageClient'
import { IntegrationEngineClient } from './IntegrationEngineClient'
import { AgentBuilderClient } from './AgentBuilderClient'
import { OmsClient } from './OmsClient'
import { OrderFormClient } from './OrderFormClient'
import { InsightsClient } from './InsightsClient'
import { GenericExternalHttpClient } from './GenericHttpClient'
import { AccountIdentifier } from './AccountIdentifier'

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

  public get omsClient() {
    return this.getOrSet('omsClient', OmsClient)
  }

  public get orderFormClient() {
    return this.getOrSet('orderFormClient', OrderFormClient)
  }

  public get insightsClient() {
    return this.getOrSet('insightsClient', InsightsClient)
  }

  public get genericHttp() {
    return this.getOrSet('genericHttp', GenericExternalHttpClient)
  }

  public get accountIdentifier() {
    return this.getOrSet('accountIdentifier', AccountIdentifier)
  }
}
