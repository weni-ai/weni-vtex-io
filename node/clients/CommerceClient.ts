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
      timeout: 15000,
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
   * Integrates a feature with a specified project.
   *
   * @param featureUUID - The unique identifier of the feature to be integrated.
   * @param projectUUID - The unique identifier of the project.
   * @param token - Authorization token for internal communication.
   * @returns Promise resolving to the result of the integration operation.
   */
  public async integrateFeature(
    featureUUID: string,
    projectUUID: string,
    token: string
  ): Promise<any> {
    const url = `/v2/feature/${featureUUID}/integrate/`

    return this.http.post(
      url,
      {
        project_uuid: projectUUID,
        created_by_vtex: true,
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
   * @returns The response from the Commerce backend.
   */
  public async sendAbandonedCartNotification(data: any): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
    }

    return this.http.post('/webhook/vtex/abandoned-cart/api/notification/', data, { headers })
  }
}
