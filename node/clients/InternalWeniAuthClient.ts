import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import querystring from 'querystring'
import { OIDC_OP_TOKEN_ENDPOINT, OIDC_RP_CLIENT_ID, OIDC_RP_CLIENT_SECRET } from '../env'

/**
 * Client for internal authentication with Weni services.
 * Retrieves the access token to authorize requests.
 */
export class InternalWeniAuthClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    const baseURL = OIDC_OP_TOKEN_ENDPOINT

    if (!baseURL) {
      throw new Error('Environment variable OIDC_OP_TOKEN_ENDPOINT is not set.')
    }

    super(baseURL, ctx, {
      ...options,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(options?.headers ?? {}),
      },
      timeout: options?.timeout ?? 10000, // Default timeout set to 10 seconds
    })
  }

  /**
   * Retrieves the access token for authentication.
   * 
   * @returns A promise resolving to the bearer token as a string.
   * @throws Error if token retrieval fails.
   */
  private async getToken(): Promise<string> {
    const clientId = OIDC_RP_CLIENT_ID
    const clientSecret = OIDC_RP_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Environment variables OIDC_RP_CLIENT_ID or OIDC_RP_CLIENT_SECRET are not set.')
    }

    const data = querystring.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    })

    const retries = 3
    let attempt = 0

    while (attempt < retries) {
      try {
        const response = await this.http.post<{ access_token: string }>('', data)
        const token = response.access_token
        if (!token) {
          throw new Error('Token response missing access_token field.')
        }
        return `Bearer ${token}`
      } catch (error) {
        attempt++
        if (attempt >= retries) {
          console.error(`Failed to fetch access token after ${retries} attempts: ${error.message}`)
          throw new Error(`Failed to fetch access token after ${retries} attempts.`)
        }
      }
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }

    console.error('Unexpected error: failed to fetch access token and reached an unreachable state.')
    throw new Error('Unexpected error: failed to fetch access token and reached an unreachable state.')
  }

  /**
   * Provides headers for authenticated requests.
   * 
   * Example:
   * ```typescript
   * const authClient = new InternalWeniAuthClient(context)
   * const headers = await authClient.getAuthHeaders()
   * ```
   * 
   * @returns A promise resolving to an object containing authorization headers.
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken()
    return {
      Authorization: token,
    }
  }
}
