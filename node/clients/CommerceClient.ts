import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import { COMMERCE_API_BASE_URL } from '../env';

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
    params: { category: string; can_vtex_integrate: string },
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
        ...integrationData, // Pass all fields dynamically
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    )
  }

  /**
   * Sends the abandoned cart notification to the Commerce backend.
   *
   * @param data - The data to be sent.
   * @param token - Authorization token for the request.
   * @returns The response from the Commerce backend.
   */
  public async sendAbandonedCartNotification(data: any, token: string): Promise<any> {
    const url = '/webhook/vtex/abandoned-cart/api/notification/'
    return this.http.post(
      url,
      data,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    )
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
    integrationData: Record<string, any>, // Accepts dynamic fields
    token: string
  ): Promise<any> {
    const url = `/v2/integrated_feature/${featureUUID}/settings/`

    return this.http.put(
      url,
      integrationData,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    )
  }
}
