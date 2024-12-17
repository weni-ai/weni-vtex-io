import type { ClientsConfig, ServiceContext, RecorderState } from '@vtex/api'
import { LRUCache, Service, method } from '@vtex/api' // Import 'method' to define routes with HTTP methods
import { Clients } from './clients' // Importing the clients module
import { getFeatureList } from './middlewares/getFeatureList' // Feature listing middleware
import { integrateAvailableFeatures } from './middlewares/integrateAvailableFeatures' // Feature integration middleware
import { proxyAbandonedCartNotification } from './middlewares/proxyAbandonedCartNotification' // Proxy abandoned cart notification middleware

// Setting cache duration in milliseconds and creating an LRUCache instance
const TIMEOUT_MS = 15000

const cache = new LRUCache<string, any>({ max: 5000 })
metrics.trackCache('status', cache) // Tracking cache for monitoring

// Clients configuration, including cache
const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
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

// Global context declaration
declare global {
  type Context = ServiceContext<Clients, State>

  interface State extends RecorderState {
    code: number
  }
}

// VTEX IO service using the configured middlewares
export default new Service({
  clients,
  routes: {
    getFeatureList: method({
      GET: [getFeatureList],
    }),
    integrateAvailableFeatures: method({ 
      POST: [integrateAvailableFeatures],
    }),
    proxyAbandonedCartNotification: method({
      POST: [proxyAbandonedCartNotification],
    }),
  },
})
