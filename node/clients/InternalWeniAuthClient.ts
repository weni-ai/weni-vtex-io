import { JanusClient, InstanceOptions, IOContext } from '@vtex/api'
import querystring from 'querystring'

/**
 * Client for internal authentication with Weni services.
 * Retrieves the access token to authorize requests.
 */
export class InternalWeniAuthClient extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    })
  }

  /**
   * Retrieves the access token for authentication.
   * 
   * @returns A promise resolving to the bearer token as a string.
   * @throws Error if token retrieval fails.
   */
  private async getToken(): Promise<string> {
    const tokenEndpoint = process.env.WENI_OIDC_TOKEN_ENDPOINT || 'https://accounts.weni.ai/auth/realms/weni-staging/protocol/openid-connect/token'
    const clientId = process.env.WENI_OIDC_CLIENT_ID || 'vtex-app'
    const clientSecret = process.env.WENI_OIDC_CLIENT_SECRET || 'X'

    const data = querystring.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    })

    console.log("tokenEndpoint", tokenEndpoint) //TODO: Remove it
  
    // Set the expected response type explicitly to include access_token
    const response = await this.http.post<{ access_token: string }>(tokenEndpoint, data)
    const token = response.access_token
    console.log("TOKEN", token)
    if (!token) {
      throw new Error('Failed to retrieve access token')
    }
    return `Bearer ${token}`
  }

  /**
   * Provides headers for authenticated requests.
   * 
   * @returns A promise resolving to an object containing authorization headers.
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken()
    return {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: token,
    }
  }
}
