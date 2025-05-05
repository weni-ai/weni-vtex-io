import { promisify } from 'util'

import type { ServiceContext } from '@vtex/api'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import axios from 'axios'
import NodeCache from 'node-cache'

import { OIDC_OP_CERTS_ENDPOINT, OIDC_OP_USERINFO_ENDPOINT } from '../env'

/**
 * Interface for user info fetched from Keycloak
 */
interface UserInfo {
  can_communicate_internally: boolean
}

/**
 * Cache configuration (10 minutes TTL)
 */
const tokenCache = new NodeCache({ stdTTL: 600, checkperiod: 120 })

/**
 * JWKS Client configuration for public key retrieval
 */
const client = jwksClient({
  jwksUri: OIDC_OP_CERTS_ENDPOINT,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
})

/**
 * Fetches the public key from the JWKS endpoint.
 * @param header - JWT header containing the key ID.
 * @returns Public key as a string.
 * @throws Error if the public key cannot be retrieved.
 */
const getKey = async (header: jwt.JwtHeader): Promise<string> => {
  const key = await promisify(client.getSigningKey)(header.kid)

  if (!key) {
    throw new Error('Public key not found.')
  }

  const signingKey = 'getPublicKey' in key ? key.getPublicKey() : null

  if (!signingKey) {
    throw new Error('Signing key could not be retrieved.')
  }

  return signingKey
}

/**
 * Fetches additional user details from the Keycloak userinfo endpoint.
 * @param accessToken - The access token to authenticate the request.
 * @returns User information object.
 * @throws Error if the request to the userinfo endpoint fails.
 */
const fetchUserInfo = async (accessToken: string): Promise<UserInfo> => {
  const response = await axios.get(OIDC_OP_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  return response.data
}

/**
 * Middleware to validate internal user authentication.
 * @param ctx - The service context.
 * @param next - The next middleware function to execute.
 */
export async function validateInternalUserAuth(
  ctx: ServiceContext,
  next: () => Promise<void>
) {
  ctx.set('Cache-Control', 'no-cache')

  const rawHeader = ctx.get('x-weni-auth')
  const token = rawHeader?.startsWith('Bearer ')
    ? rawHeader.replace('Bearer ', '')
    : rawHeader

  // Validate if token is present and properly formatted
  if (!token) {
    ctx.status = 401
    ctx.body = { message: 'JWT Token is missing or invalid format.' }

    return
  }

  try {
    // Check if the token is cached
    if (tokenCache.has(token)) {
      try {
        await next()
      } catch (error) {
        const err = error as Error & { response?: { data?: unknown } }

        console.error('Error in next middleware (cached token):', {
          message: err.message,
          stack: err.stack,
          response: err.response?.data || 'No response data',
        })
        ctx.status = 500
        ctx.body = {
          message: 'Internal server error in the next middleware.',
          error: err.message,
          details: err.response?.data || 'No additional details',
        }
      }

      return
    }

    // Decode and validate the token header
    const decodedHeader = jwt.decode(token, { complete: true })

    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      throw new Error('Invalid token header.')
    }

    const publicKey = await getKey(decodedHeader.header)

    jwt.verify(token, publicKey)

    // Fetch additional user info
    const userInfo = await fetchUserInfo(token)
    const canCommunicateInternally = userInfo?.can_communicate_internally

    // Validate internal communication permission
    if (!canCommunicateInternally) {
      ctx.status = 403
      ctx.body = { message: 'Forbidden: User cannot communicate internally.' }

      return
    }

    // Cache the token after successful validation
    tokenCache.set(token, true)
  } catch (error) {
    const err = error as Error & { response?: { data?: unknown } }

    console.error('JWT validation error:', {
      message: err.message,
      stack: err.stack,
      response: err.response?.data || 'No response data',
    })
    ctx.status = 401
    ctx.body = {
      message: 'Invalid token.',
      error: err.message,
      details: err.response?.data || 'No additional details',
    }

    return
  }

  // Try-catch block for the next middleware
  try {
    await next()
  } catch (error) {
    const err = error as Error & { response?: { data?: unknown } }

    console.error('Error in next middleware:', {
      message: err.message,
      stack: err.stack,
      response: err.response?.data || 'No response data',
    })
    ctx.status = 500
    ctx.body = {
      message: 'Internal server error in the next middleware.',
      error: err.message,
      details: err.response?.data || 'No additional details',
    }
  }
}
