/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ClientsConfig,
  ServiceContext,
  RecorderState,
  EventContext,
} from '@vtex/api'
import { LRUCache, Service } from '@vtex/api'

import { Clients } from './clients'

const TIMEOUT_MS = 60000

const cache = new LRUCache<string, any>({ max: 5000 })

metrics.trackCache('status', cache)

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 0,
      timeout: TIMEOUT_MS,
    },
    commerceClient: {
      memoryCache: cache,
    },
    internalWeniAuthClient: {
      memoryCache: cache,
    },
  },
}

declare global {
  type Context = ServiceContext<Clients, State>

  interface State extends RecorderState {
    code: number
  }

  // Kept for TypeScript compilation of unused middlewares until they are removed.
  interface StatusChangeContext extends EventContext<Clients> {
    body: {
      domain: string
      orderId: string
      currentState: string
      lastState: string
      currentChangeDate: string
      lastChangeDate: string
    }
  }
}

// Routes and events removed to avoid conflicts with the replacement app.
export default new Service({
  clients,
  events: {},
  routes: {},
})
