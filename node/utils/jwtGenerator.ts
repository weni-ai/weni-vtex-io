import jwt from 'jsonwebtoken'

import { JWT_PRIVATE_KEY } from '../env'

/**
 * Token expiration time in seconds (1 minute)
 */
const TOKEN_EXPIRATION_SECONDS = 60

/**
 * Generates a JWT token signed with RS256 algorithm for inter-module communication.
 *
 * This function creates a JWT token that can be used to authenticate requests
 * from the VTEX IO module to other Weni services (e.g., retail-setup).
 * The token includes vtex_account as the identifier since IO doesn't have project_uuid.
 *
 * @param vtexAccount - The VTEX account identifier
 * @returns The signed JWT token as a string
 * @throws Error if JWT_PRIVATE_KEY is not configured
 */
export function generateJWTToken(vtexAccount: string): string {
  if (!JWT_PRIVATE_KEY || JWT_PRIVATE_KEY.includes('REPLACE_WITH')) {
    throw new Error('JWT_PRIVATE_KEY is not configured.')
  }

  const now = Math.floor(Date.now() / 1000)

  const payload = {
    vtex_account: vtexAccount,
    iat: now,
    exp: now + TOKEN_EXPIRATION_SECONDS,
  }

  const token = jwt.sign(payload, JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
  })

  return token
}

/**
 * Generates authorization headers with JWT token for inter-module communication.
 *
 * @param vtexAccount - The VTEX account identifier
 * @returns An object containing the Authorization header with Bearer token
 * @throws Error if JWT_PRIVATE_KEY is not configured
 */
export function getJWTAuthHeaders(vtexAccount: string): Record<string, string> {
  const token = generateJWTToken(vtexAccount)

  return {
    Authorization: `Bearer ${token}`,
  }
}
