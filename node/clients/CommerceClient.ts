import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import { COMMERCE_API_BASE_URL } from '../env'

/**
 * Client for interacting with the Commerce module to fetch and integrate feature details.
 * Handles internal authentication and environment-specific configurations.
 */
export class CommerceClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    const baseUrl = COMMERCE_API_BASE_URL

    if (!baseUrl) {
      throw new Error('COMMERCE_API_BASE_URL is not defined')
    }

    super(baseUrl, context, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    })
  }

  /**
   * Retrieves available features based on the provided filters.
   *
   * @param params - The filter parameters for the request.
   * @param token - Authorization token for internal communication.
   * @param projectUUID - The unique identifier of the project.
   * @returns Promise resolving to the list of features.
   */
  public async getFeatures(
    params: {
      category: string
      can_vtex_integrate: string
      nexus_agents: string
    },
    token: string,
    projectUUID: string
  ): Promise<any> {
    const url = `/v2/feature/${projectUUID}/`

    return this.http.get(url, {
      headers: {
        Authorization: `${token}`,
      },
      params,
    })
  }

  /**
   * Retrieves available integrated features based on the provided filters.
   *
   * @param params - The filter parameters for the request.
   * @param token - Authorization token for internal communication.
   * @param projectUUID - The unique identifier of the project.
   * @returns Promise resolving to the list of integrated features.
   */
  public async getIntegratedFeatures(
    params: { category: string; can_vtex_integrate: string },
    token: string,
    projectUUID: string
  ): Promise<any> {
    const url = `/v2/app_integrated_feature/${projectUUID}/`

    return this.http.get(url, {
      headers: {
        authorization: `${token}`,
      },
      params,
    })
  }

  /**
   * Integrates a feature with a specified project, allowing dynamic fields.
   *
   * @param featureUUID - The unique identifier of the feature to be integrated.
   * @param integrationData - An object containing required and dynamic integration fields.
   * @param token - Authorization token for internal communication.
   * @returns Promise resolving to the result of the integration operation.
   */
  public async integrateFeature(
    featureUUID: string,
    integrationData: Record<string, any>, // Accepts dynamic fields
    token: string
  ): Promise<any> {
    const url = `/v2/feature/${featureUUID}/integrate/`

    return this.http.post(
      url,
      {
        created_by_vtex: true,
        ...integrationData,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    )
  }

  /**
   * Integrates a Nexus agent with a specified project.
   *
   * @param data - Object containing project_uuid and agent_uuid.
   * @param token - Authorization token for internal communication.
   * @returns Promise resolving to the result of the agent integration.
   */
  public async integrateNexusAgent(
    data: { project_uuid: string; agent_uuid: string },
    token: string
  ): Promise<any> {
    const url = `/v2/nexus/integrate-agent/`

    return this.http.post(url, data, {
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Sends the abandoned cart notification to the Commerce backend.
   *
   * @param data - The data to be sent.
   * @param token - Authorization token for the request.
   * @returns The response from the Commerce backend.
   */
  public async sendAbandonedCartNotification(
    data: any,
    token: string
  ): Promise<any> {
    const url = '/webhook/vtex/abandoned-cart/api/notification/'

    return this.http.post(url, data, {
      headers: {
        Authorization: `${token}`,
      },
    })
  }

  /**
   * Disables a feature integration with a specified project.
   *
   * @param projectUUID - The unique identifier of the project.
   * @param featureUUID - The unique identifier of the feature to be disabled.
   * @param token - Authorization token for internal communication.
   * @returns Promise resolving to the result of the disable operation.
   */
  public async disableFeature(
    projectUUID: string,
    featureUUID: string,
    token: string
  ): Promise<any> {
    const url = `/v2/feature/${featureUUID}/integrate/`

    return this.http.delete(url, {
      headers: {
        Authorization: `${token}`,
      },
      data: {
        project_uuid: projectUUID,
      },
    })
  }

  /**
   * Update a feature integration's settings with a specified project.
   *
   * @param featureUUID - The unique identifier of the feature to be disabled.
   * @param token - Authorization token for internal communication.
   * @param integrationData - An object containing required and dynamic integration fields.
   * @returns Promise resolving to the result of the disable operation.
   */
  public async updateFeatureSettings(
    featureUUID: string,
    integrationData: Record<string, any>,
    token: string
  ): Promise<any> {
    const url = `/v2/integrated_feature/${featureUUID}/settings/`

    return this.http.put(url, integrationData, {
      headers: {
        Authorization: `${token}`,
      },
    })
  }

  /**
   * Sends an order status update notification to the Commerce webhook.
   *
   * @param data - The event data, including order status and vtex_account.
   * @param token - Authentication token for the request.
   * @returns Promise resolving to the response from the Commerce backend.
   */
  public async sendOrderStatusNotification(
    data: any,
    token: string
  ): Promise<any> {
    const url = '/webhook/vtex/order-status/api/notification/'

    return this.http.post(url, data, {
      headers: {
        Authorization: `${token}`,
      },
    })
  }

  /**
   * Sets the VTEX store type for a given project.
   *
   * @param projectUUID - The unique identifier of the project.
   * @param data - The payload containing the VTEX store type (or other fields in the future).
   * @param token - Authorization token for internal communication.
   * @returns Promise resolving to the response from the backend.
   */
  public async setVtexStoreType(
    projectUUID: string,
    data: Record<string, any>,
    token: string
  ): Promise<any> {
    const url = `/api/vtex-projects/${projectUUID}/set-vtex-store-type/`

    return this.http.post(url, data, {
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'application/json',
      },
    })
  }
}
