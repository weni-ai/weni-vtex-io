import type { RecorderState, ServiceContext } from '@vtex/api'
import jwt from 'jsonwebtoken'

import type { Clients } from '../clients'
import { JWT_PUBLIC_KEY } from '../env'

/**
 * Interface for the JWT payload from retail-setup module
 */
interface JWTPayload {
  vtex_account: string
  exp: number
  iat: number
}

/**
 * Extended state interface for JWT authentication
 */
interface JWTState extends RecorderState {
  vtexAccount?: string
  jwtPayload?: JWTPayload
}

/**
 * Middleware to validate JWT authentication for inter-module communication.
 *
 * This middleware validates JWT tokens signed with RS256 algorithm from the
 * retail-setup Python module. It extracts and validates the vtex_account
 * from the token payload.
 *
 * Expected token structure:
 * - Header: x-weni-auth: Bearer <jwt_token> (or just the token without Bearer prefix)
 * - Payload: { vtex_account: string, exp: number, iat: number }
 *
 * Note: We use x-weni-auth instead of Authorization because VTEX overwrites
 * the standard Authorization header.
 *
 * On successful validation, injects into ctx.state:
 * - vtexAccount: The validated VTEX account
 * - jwtPayload: The full decoded JWT payload
 *
 * @param ctx - VTEX IO service context
 * @param next - The next middleware function to execute
 */
export async function validateJWTAuth(
  ctx: ServiceContext<Clients, JWTState>,
  next: () => Promise<void>
) {
  ctx.set('Cache-Control', 'no-cache')

  const rawHeader = ctx.get('x-weni-auth')
  const token = rawHeader?.startsWith('Bearer ')
    ? rawHeader.replace('Bearer ', '')
    : rawHeader

  // Validate if token is present and properly formatted
  if (!token) {
    console.warn(
      'JWT validation failed: Missing or invalid x-weni-auth header',
      {
        path: ctx.path,
        method: ctx.method,
        ip: ctx.ip,
      }
    )

    ctx.status = 401
    ctx.body = { message: 'JWT Token is missing or invalid format.' }

    return
  }

  try {
    // Validate JWT_PUBLIC_KEY is configured
    if (!JWT_PUBLIC_KEY) {
      console.error('JWT validation failed: JWT_PUBLIC_KEY is not configured')

      ctx.status = 500
      ctx.body = { message: 'JWT public key is not configured.' }

      return
    }

    // Verify and decode the token using RS256 algorithm
    const payload = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
    }) as JWTPayload

    // Validate vtex_account existence in payload
    const tokenVtexAccount = payload.vtex_account

    if (!tokenVtexAccount) {
      console.warn('JWT validation failed: Required token claims are missing', {
        path: ctx.path,
        method: ctx.method,
      })

      ctx.status = 401
      ctx.body = { message: 'Unauthorized: Missing required token parameters.' }

      return
    }

    // Validate account isolation: token account must match request context account
    const contextVtexAccount =
      ctx.vtex?.account ?? (ctx.header['x-vtex-account'] as string | undefined)

    if (!contextVtexAccount) {
      console.warn(
        'JWT validation failed: Missing VTEX account in request context',
        {
          path: ctx.path,
          method: ctx.method,
        }
      )

      ctx.status = 401
      ctx.body = { message: 'Missing VTEX account in request context.' }

      return
    }

    if (tokenVtexAccount !== contextVtexAccount) {
      console.warn('JWT validation failed: Account validation did not pass', {
        path: ctx.path,
        method: ctx.method,
      })

      ctx.status = 403
      ctx.body = { message: 'Forbidden: Account validation failed.' }

      return
    }

    // Inject validated data into context state for downstream handlers
    ctx.state.vtexAccount = tokenVtexAccount
    ctx.state.jwtPayload = payload
  } catch (error) {
    const err = error as Error & {
      name?: string
      response?: { data?: unknown }
    }

    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      console.warn('JWT validation failed: Token expired', {
        path: ctx.path,
        method: ctx.method,
      })

      ctx.status = 401
      ctx.body = { message: 'Token expired.' }

      return
    }

    if (err.name === 'JsonWebTokenError') {
      console.warn('JWT validation failed: Invalid token signature or format', {
        message: err.message,
        path: ctx.path,
        method: ctx.method,
      })

      ctx.status = 401
      ctx.body = { message: 'Invalid token.' }

      return
    }

    if (err.name === 'NotBeforeError') {
      console.warn('JWT validation failed: Token not yet valid', {
        path: ctx.path,
        method: ctx.method,
      })

      ctx.status = 401
      ctx.body = { message: 'Token not yet valid.' }

      return
    }

    // Generic error handling
    console.error('JWT validation error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      response: err.response?.data || 'No response data',
    })

    ctx.status = 401
    ctx.body = {
      message: 'Invalid token.',
      error: err.message,
    }

    return
  }

  // Execute next middleware
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
