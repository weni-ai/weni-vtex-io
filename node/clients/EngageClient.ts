import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import { ENGAGE_API_BASE_URL } from '../env'

/**
 * Client for interacting with Weni Engage API.
 * Handles creating users, projects, and organizations in Weni Engage.
 */
export class EngageClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    const baseURL = ENGAGE_API_BASE_URL

    if (!baseURL) {
      throw new Error('ENGAGE_API_BASE_URL is not defined')
    }

    super(baseURL, ctx, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      timeout: options?.timeout ?? 60000,
    })
  }

  /**
   * Creates a user, project, and organization in Weni Engage.
   *
   * @param data - Payload containing user, project, and organization details.
   * @param token - Authorization token for the request.
   * @returns A promise resolving to an object containing project_uuid and organization_uuid.
   */
  public async createUserAndProject(
    data: Record<string, any>,
    token: string
  ): Promise<any> {
    const url = '/v2/commerce/'

    return this.http.post(url, data, {
      headers: {
        Authorization: `${token}`,
      },
    })
  }

  /**
   * Checks if a project exists for the given VTEX account and user email.
   *
   * @param vtexAccount - VTEX account name
   * @param userEmail - User email to check
   * @param token - Authorization token for the request
   * @returns A promise resolving to the project check response
   */
  public async checkProject(
    vtexAccount: string,
    userEmail: string,
    token: string
  ): Promise<any> {
    const url = '/v2/commerce/check-project'

    return this.http.get(url, {
      headers: {
        Authorization: `${token}`,
      },
      params: {
        vtex_account: vtexAccount,
        user_email: userEmail,
      },
    })
  }
}
