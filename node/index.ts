import type { ClientsConfig, ServiceContext, RecorderState } from '@vtex/api'
import { LRUCache, Service, method } from '@vtex/api' // Import 'method' to define routes with HTTP methods
import { Clients } from './clients' // Importing the clients module
import { getFeatureList } from './middlewares/getFeatureList' // Feature listing middleware
import { integrateAvailableFeatures } from './middlewares/integrateAvailableFeatures' // Feature integration middleware
import { proxyAbandonedCartNotification } from './middlewares/proxyAbandonedCartNotification' // Proxy abandoned cart notification middleware
import { createUserAndProject } from './middlewares/createUserAndProject' // Middleware to create user, project, and organization in Weni Engage
import { proxyWhatsAppIntegration } from './middlewares/proxyWhatsAppIntegration' // Middleware to handle WhatsApp Cloud integration
import { createAgentBuilder } from './middlewares/createAgentBuilder' // Middleware to configure AgentBuilder
import { getOrdersByEmail } from './middlewares/getOrdersByEmail' // Middleware to fetch orders by user email
import { getOrderFormDetails } from './middlewares/getOrderFormDetails' // Middleware to fetch order form details by ID
import { validateInternalUserAuth } from './middlewares/validateInternalUserAuth' // Middleware to validate internal user requests
import { integrateFeature } from './middlewares/integrateFeature' // Middleware to integrate features


// Setting cache duration in milliseconds and creating an LRUCache instance
const TIMEOUT_MS = 60000

const cache = new LRUCache<string, any>({ max: 5000 })
metrics.trackCache('status', cache) // Tracking cache for monitoring

// Clients configuration, including cache
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
      GET: [validateInternalUserAuth, getFeatureList],
    }),
    integrateAvailableFeatures: method({
      POST: [validateInternalUserAuth, integrateAvailableFeatures],
    }),
    proxyAbandonedCartNotification: method({
      POST: [validateInternalUserAuth, proxyAbandonedCartNotification],
    }),
    createUserAndProject: method({
      POST: [validateInternalUserAuth, createUserAndProject],
    }),
    proxyWhatsAppIntegration: method({
      POST: [validateInternalUserAuth, proxyWhatsAppIntegration],
    }),
    createAgentBuilder: method({
      POST: [validateInternalUserAuth, createAgentBuilder]
    }),
    getOrdersByEmail: method({
      GET: [validateInternalUserAuth, getOrdersByEmail],
    }),
    getOrderFormDetails: method({
      GET: [validateInternalUserAuth, getOrderFormDetails],
    }),

    integrateFeature: method({
      POST: [validateInternalUserAuth, integrateFeature],
    }),

  },
})
