import { ServiceContext } from '@vtex/api'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import axios from 'axios'
import { promisify } from 'util'
import NodeCache from 'node-cache'
import { OIDC_OP_CERTS_ENDPOINT, OIDC_OP_USERINFO_ENDPOINT } from '../env'

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
 */
const fetchUserInfo = async (accessToken: string) => {
    const response = await axios.get(OIDC_OP_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    return response.data
}

/**
 * Middleware to validate internal user authentication.
 * @param ctx - The service context.
 * @param next - Next middleware function.
 */
export async function validateInternalUserAuth(ctx: ServiceContext, next: () => Promise<void>) {
    const token = ctx.query.token as string

    // Validate if token is present
    if (!token) {
        ctx.status = 401
        ctx.body = { message: 'JWT Token is missing.' }
        return
    }

    try {
        // Check if the token is cached
        if (tokenCache.has(token)) {
            await next()
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

        // Proceed to the next middleware
        await next()
    } catch (error) {
        console.error('JWT validation error:', error.message)
        ctx.status = 401
        ctx.body = { message: 'Invalid token.', error: error.message }
    }
}
