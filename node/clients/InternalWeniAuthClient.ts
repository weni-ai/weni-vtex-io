import querystring from 'querystring'

import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import {
  OIDC_OP_TOKEN_ENDPOINT,
  OIDC_RP_CLIENT_ID,
  OIDC_RP_CLIENT_SECRET,
} from '../env'

/**
 * Interface for cached token data
 */
interface CachedToken {
  token: string
  expiresAt: number
}

/**
 * Token cache with expiration buffer (refresh 5 minutes before expiry)
 */
let cachedToken: CachedToken | null = null
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes before expiry
const MAX_RETRIES = 3

/**
 * Delay helper for retry backoff
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Client for internal authentication with Weni services.
 * Retrieves the access token to authorize requests.
 * Implements token caching to avoid unnecessary OIDC calls.
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
      timeout: options?.timeout ?? 60000, // Default timeout set to 60 seconds
    })
  }

  /**
   * Checks if the cached token is still valid.
   * Returns true if token exists and won't expire within the buffer period.
   */
  private isTokenValid(): boolean {
    if (!cachedToken) {
      return false
    }

    const now = Date.now()

    return cachedToken.expiresAt - TOKEN_REFRESH_BUFFER_MS > now
  }

  /**
   * Fetches a new token from the OIDC endpoint with retry logic.
   */
  private async fetchTokenWithRetry(
    requestData: string,
    attempt: number
  ): Promise<string> {
    try {
      const response = await this.http.post<{
        access_token: string
        expires_in?: number
      }>('', requestData)

      const token = response.access_token

      if (!token) {
        throw new Error('Token response missing access_token field.')
      }

      const bearerToken = `Bearer ${token}`

      // Cache the token with expiration time
      // Default to 1 hour if expires_in is not provided
      const expiresInMs = (response.expires_in ?? 3600) * 1000

      cachedToken = {
        token: bearerToken,
        expiresAt: Date.now() + expiresInMs,
      }

      return bearerToken
    } catch (error) {
      const nextAttempt = attempt + 1

      if (nextAttempt >= MAX_RETRIES) {
        const err = error as Error

        throw new Error(
          `Failed to fetch access token after ${MAX_RETRIES} attempts: ${err.message}`
        )
      }

      // Exponential backoff
      await delay(2 ** nextAttempt * 1000)

      return this.fetchTokenWithRetry(requestData, nextAttempt)
    }
  }

  /**
   * Retrieves the access token for authentication.
   * Uses cached token if still valid, otherwise fetches a new one.
   *
   * @returns A promise resolving to the bearer token as a string.
   * @throws Error if token retrieval fails.
   */
  private async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.isTokenValid() && cachedToken) {
      const remainingMs = cachedToken.expiresAt - Date.now()
      const remainingMin = Math.round(remainingMs / 60000)

      // eslint-disable-next-line no-console
      console.log('[OIDC Cache] Using cached token', {
        expiresIn: `${remainingMin} minutes`,
      })

      return cachedToken.token
    }

    // eslint-disable-next-line no-console
    console.log(
      '[OIDC Cache] Token expired or not found, fetching new token...'
    )

    const clientId = OIDC_RP_CLIENT_ID
    const clientSecret = OIDC_RP_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error(
        'Environment variables OIDC_RP_CLIENT_ID or OIDC_RP_CLIENT_SECRET are not set.'
      )
    }

    const data = querystring.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    })

    return this.fetchTokenWithRetry(data, 0)
  }

  /**
   * Provides headers for authenticated requests.
   * Uses cached token when available to minimize OIDC calls.
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
