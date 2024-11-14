import { JanusClient, InstanceOptions, IOContext } from '@vtex/api'

/**
 * Client for interacting with the Commerce module to fetch and integrate feature details.
 * Handles internal authentication and environment-specific configurations.
 */
export class CommerceClient extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
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
    params: { category: string; can_vtex_integrate: boolean },
    token: string,
    projectUUID: string
  ): Promise<any> {
    const baseUrl = this.context.workspace === 'production'
      ? process.env.COMMERCE_API_BASE_URL
      : 'https://f3d1-170-82-73-20.ngrok-free.app' //TODO: Remove It

    const url = `${baseUrl}/v2/feature/${projectUUID}/`
    // Set the Authorization header with Bearer token
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
    const baseUrl = this.context.workspace === 'production'
      ? process.env.COMMERCE_API_BASE_URL
      : 'https://f3d1-170-82-73-20.ngrok-free.app' //TODO: Remove It

    const url = `${baseUrl}/v2/feature/${featureUUID}/integrate/`
    // Set the Authorization header with Bearer token
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
}
