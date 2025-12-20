import type { RecorderState, ServiceContext } from '@vtex/api'
import jwt from 'jsonwebtoken'
import NodeCache from 'node-cache'

import type { Clients } from '../clients'
import { JWT_PUBLIC_KEY } from '../env'

/**
 * Interface for the JWT payload from retail-setup module
 */
interface JWTPayload {
  project_uuid: string
  exp: number
  iat: number
}

/**
 * Extended state interface for JWT authentication
 */
interface JWTState extends RecorderState {
  projectUuid?: string
  jwtPayload?: JWTPayload
}

/**
 * UUID v4 validation regex pattern
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Cache configuration (10 minutes TTL) for validated tokens
 */
const tokenCache = new NodeCache({ stdTTL: 600, checkperiod: 120 })

/**
 * Validates if a string is a valid UUID v4
 * @param uuid - String to validate
 * @returns True if valid UUID, false otherwise
 */
const isValidUUID = (uuid: string): boolean => {
  return UUID_REGEX.test(uuid)
}

/**
 * Middleware to validate JWT authentication for inter-module communication.
 *
 * This middleware validates JWT tokens signed with RS256 algorithm from the
 * retail-setup Python module. It extracts and validates the project_uuid
 * from the token payload.
 *
 * Expected token structure:
 * - Header: x-weni-auth: Bearer <jwt_token> (or just the token without Bearer prefix)
 * - Payload: { project_uuid: string, exp: number, iat: number }
 *
 * Note: We use x-weni-auth instead of Authorization because VTEX overwrites
 * the standard Authorization header.
 *
 * On successful validation, injects into ctx.state:
 * - projectUuid: The validated project UUID
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
    // Check if the token is already cached (validated previously)
    const cachedPayload = tokenCache.get<JWTPayload>(token)

    if (cachedPayload) {
      console.info('JWT token validated from cache', {
        projectUuid: cachedPayload.project_uuid,
      })

      ctx.state.projectUuid = cachedPayload.project_uuid
      ctx.state.jwtPayload = cachedPayload

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

    // Validate project_uuid existence in payload
    const projectUuid = payload.project_uuid

    if (!projectUuid) {
      console.warn(
        'JWT validation failed: project_uuid not found in token payload',
        {
          path: ctx.path,
          method: ctx.method,
        }
      )

      ctx.status = 401
      ctx.body = { message: 'project_uuid not found in token payload.' }

      return
    }

    // Validate project_uuid format (must be valid UUID)
    if (!isValidUUID(projectUuid)) {
      console.warn('JWT validation failed: Invalid project_uuid format', {
        projectUuid,
        path: ctx.path,
        method: ctx.method,
      })

      ctx.status = 401
      ctx.body = { message: 'Invalid project_uuid format.' }

      return
    }

    // Cache the validated token payload
    tokenCache.set(token, payload)

    // Inject validated data into context state for downstream handlers
    ctx.state.projectUuid = projectUuid
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
