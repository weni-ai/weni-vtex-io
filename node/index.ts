/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ClientsConfig,
  ServiceContext,
  RecorderState,
  EventContext,
} from '@vtex/api'
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
import { integrateFeature } from './middlewares/integrateFeature' // Middleware to integrate features
import { disableFeature } from './middlewares/disableFeature' // Middleware to disable features
import { updateFeatureSettings } from './middlewares/updateFeatureSettings' // Middleware to update feature settings
import { allStates } from './middlewares/allStates' // Middleware to receive order status updates
import { getOrderById } from './middlewares/getOrderById' // Middleware to fetch order by ID
import { getIntegratedFeaturesList } from './middlewares/getIntegratedFeatures' // Middleware to fetch integrated features list
import { validateVtexInternalRequest } from './middlewares/validateVtexInternalRequest' // Middleware to validate VTEX internal request
import { checkWhatsAppIntegration } from './middlewares/checkWhatAppIntegration' // Middleware to check WhatsApp integration
import { checkProjectByUser } from './middlewares/checkProjectByUser' // Middleware to check project by user
import { checkAgentBuilder } from './middlewares/checkAgentBuilder' // Middleware to check agent builder
import { validateInternalUserAuth } from './middlewares/validateInternalUserAuth' // Middleware to validate internal user authentication

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

// VTEX IO service using the configured middlewares
export default new Service({
  clients,
  events: {
    allStates,
  },
  routes: {
    getFeatureList: method({
      GET: [validateVtexInternalRequest, getFeatureList],
    }),
    integrateAvailableFeatures: method({
      POST: [validateVtexInternalRequest, integrateAvailableFeatures],
    }),
    proxyAbandonedCartNotification: method({
      POST: [validateVtexInternalRequest, proxyAbandonedCartNotification],
    }),
    createUserAndProject: method({
      POST: [validateVtexInternalRequest, createUserAndProject],
    }),
    proxyWhatsAppIntegration: method({
      POST: [validateVtexInternalRequest, proxyWhatsAppIntegration],
    }),
    createAgentBuilder: method({
      POST: [validateVtexInternalRequest, createAgentBuilder],
    }),
    getOrdersByEmail: method({
      GET: [validateInternalUserAuth, getOrdersByEmail],
    }),
    getOrderFormDetails: method({
      GET: [validateInternalUserAuth, getOrderFormDetails],
    }),

    integrateFeature: method({
      POST: [validateVtexInternalRequest, integrateFeature],
    }),

    disableFeature: method({
      DELETE: [validateVtexInternalRequest, disableFeature],
    }),

    updateFeatureSettings: method({
      PUT: [validateVtexInternalRequest, updateFeatureSettings],
    }),

    getOrderById: method({
      GET: [validateInternalUserAuth, getOrderById],
    }),
    getIntegratedFeatures: method({
      GET: [validateVtexInternalRequest, getIntegratedFeaturesList],
    }),

    checkWhatsAppIntegration: method({
      GET: [validateVtexInternalRequest, checkWhatsAppIntegration],
    }),

    checkProjectByUser: method({
      GET: [validateVtexInternalRequest, checkProjectByUser],
    }),

    checkAgentBuilder: method({
      GET: [validateVtexInternalRequest, checkAgentBuilder],
    }),
  },
})
