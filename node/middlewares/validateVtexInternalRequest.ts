import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

/**
 * Middleware to validate if the request is coming from a VTEX IO environment.
 * This middleware does not require authentication tokens, it only checks VTEX headers.
 *
 * @param ctx - VTEX IO service context.
 * @param next - The next middleware function to execute.
 */
export async function validateVtexInternalRequest(
  ctx: ServiceContext<Clients>,
  next: () => Promise<void>
) {
  const vtexAccount = ctx.header['x-vtex-account'] as string
  const vtexCaller = ctx.header['x-vtex-caller'] as string
  const vtexWorkspace = ctx.header['x-vtex-workspace'] as string

  const missingHeaders = []

  if (!vtexAccount) missingHeaders.push('x-vtex-account')
  if (!vtexCaller) missingHeaders.push('x-vtex-caller')
  if (!vtexWorkspace) missingHeaders.push('x-vtex-workspace')

  if (missingHeaders.length > 0) {
    ctx.status = 401
    ctx.body = {
      message: 'Unauthorized: Request is not from a valid VTEX IO environment.',
    }

    // Log detailed error information for internal monitoring
    console.error(
      `Unauthorized request detected: Missing VTEX headers [${missingHeaders.join(
        ', '
      )}]`,
      {
        missingHeaders,
        headers: { vtexAccount, vtexCaller, vtexWorkspace },
        path: ctx.path,
        method: ctx.method,
        ip: ctx.ip,
      }
    )

    return
  }

  await next()
}
