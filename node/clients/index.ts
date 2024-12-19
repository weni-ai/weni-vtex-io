import { IOClients } from '@vtex/api'
import { CommerceClient } from './CommerceClient'
import { InternalWeniAuthClient } from './InternalWeniAuthClient'
import { EngageClient } from './EngageClient'

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
}
