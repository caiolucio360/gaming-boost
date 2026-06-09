/**
 * API Handler Wrapper
 *
 * Higher-Order Function that encapsulates the repetitive boilerplate
 * shared across API routes: authentication, rate limiting, and error handling.
 *
 * Follows the code-simplifier agent principles: DRY, KISS, YAGNI.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, verifyRole, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import type { AuthResult } from '@/lib/auth-middleware'
import { getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { HttpStatus } from '@/lib/http-status'
import { ErrorCodes, ErrorMessages } from '@/lib/error-constants'

// NOTE: `createApiErrorResponse` is intentionally NOT imported statically.
// `api-errors.ts` has a transitive Prisma import; pulling it into this module's
// static graph would load Prisma in every route that uses `withApiHandler`,
// breaking the Jest tests of routes that don't mock it. We `import()` it lazily
// inside the catch block instead, so the static graph stays Prisma-free.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RateLimiter {
  check(identifier: string, limit: number): Promise<RateLimitResult>
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export interface HandlerContext {
  request: NextRequest
  user: {
    id: number
    email: string
    role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
    isDevAdmin: boolean
  }
  rateLimitResult?: RateLimitResult
}

export interface HandlerOptions {
  /** Enable auth. `true` = any authenticated user; `{ roles: [...] }` = specific roles */
  auth?: boolean | { roles: Array<'CLIENT' | 'BOOSTER' | 'ADMIN'> }

  /** Rate limit configuration */
  rateLimit?: { limiter: RateLimiter; max: number }

  /** Custom message for rate limit exceeded responses */
  rateLimitMessage?: string

  /** Default error message for catch block */
  errorMessage?: string

  /** Endpoint context string for logging (e.g. 'POST /api/orders') */
  endpoint?: string
}

type HandlerFn = (ctx: HandlerContext) => Promise<NextResponse>

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps an API route handler with standardized auth, rate limiting, and error handling.
 *
 * @example
 * ```typescript
 * export const GET = withApiHandler(
 *   async ({ request, user }) => {
 *     const orders = await OrderService.getUserOrders(user.id)
 *     return NextResponse.json({ orders }, { status: HttpStatus.OK })
 *   },
 *   { auth: true, errorMessage: ErrorMessages.ORDER_FETCH_FAILED, endpoint: 'GET /api/orders' }
 * )
 * ```
 */
export function withApiHandler(
  handler: HandlerFn,
  options: HandlerOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Rate Limiting (checked before auth to prevent wasting auth lookups)
      let rateLimitResult: RateLimitResult | undefined
      if (options.rateLimit) {
        const identifier = getIdentifier(request)
        rateLimitResult = await options.rateLimit.limiter.check(identifier, options.rateLimit.max)

        if (!rateLimitResult.success) {
          return NextResponse.json(
            {
              message: options.rateLimitMessage || ErrorMessages.RATE_LIMIT_GENERIC,
              error: ErrorCodes.RATE_LIMIT_EXCEEDED,
            },
            {
              status: HttpStatus.TOO_MANY_REQUESTS,
              headers: createRateLimitHeaders(rateLimitResult),
            }
          )
        }
      }

      // 2. Authentication
      let authResult: AuthResult | undefined
      if (options.auth) {
        if (typeof options.auth === 'object' && 'roles' in options.auth) {
          authResult = await verifyRole(request, options.auth.roles)
        } else {
          authResult = await verifyAuth(request)
        }

        if (!authResult.authenticated || !authResult.user) {
          return createAuthErrorResponseFromResult(authResult)
        }
      }

      // 3. Execute handler
      const user = authResult?.user ?? {
        id: 0,
        email: '',
        role: 'CLIENT' as const,
        isDevAdmin: false,
      }

      return await handler({ request, user, rateLimitResult })
    } catch (error) {
      // 4. Error handling — lazy import keeps the Prisma-backed api-errors module
      // out of this file's static graph (see note at top of file).
      const { createApiErrorResponse } = await import('@/lib/api-errors')
      return createApiErrorResponse(
        error,
        options.errorMessage || ErrorMessages.GENERIC_ERROR,
        options.endpoint || 'unknown'
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely parse a string parameter to an integer.
 * Returns null if the string is not a valid integer.
 */
export function parseIntParam(value: string): number | null {
  if (!value) return null
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}
