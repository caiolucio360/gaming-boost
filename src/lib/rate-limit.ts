/**
 * Rate Limiting Utility
 *
 * Provides in-memory rate limiting for API endpoints to prevent abuse.
 * For production with multiple instances, consider using Redis-based rate limiting.
 *
 * Usage:
 * ```typescript
 * import { rateLimit } from '@/lib/rate-limit'
 *
 * const limiter = rateLimit({
 *   interval: 60 * 1000, // 1 minute
 *   uniqueTokenPerInterval: 500, // Max 500 unique IPs per interval
 * })
 *
 * // In API route:
 * const identifier = request.headers.get('x-forwarded-for') || 'unknown'
 * const { success, limit, remaining, reset } = await limiter.check(identifier, 10)
 *
 * if (!success) {
 *   return Response.json({ error: 'Rate limit exceeded' }, {
 *     status: 429,
 *     headers: {
 *       'X-RateLimit-Limit': limit.toString(),
 *       'X-RateLimit-Remaining': remaining.toString(),
 *       'X-RateLimit-Reset': reset.toString(),
 *     }
 *   })
 * }
 * ```
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval?: number // Max unique tokens to track
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp when the limit resets
}

class RateLimiter {
  private tokenCache: Map<string, number[]>
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.tokenCache = new Map()
    this.config = {
      interval: config.interval,
      uniqueTokenPerInterval: config.uniqueTokenPerInterval || 500,
    }
  }

  /**
   * Check if a request should be allowed
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @param limit - Maximum number of requests allowed in the interval
   * @returns RateLimitResult with success status and headers
   */
  async check(identifier: string, limit: number): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.interval

    // Get or create token bucket
    const tokenBucket = this.tokenCache.get(identifier) || []

    // Remove expired tokens (outside the time window)
    const validTokens = tokenBucket.filter((timestamp) => timestamp > windowStart)

    // Clean up old tokens from cache to prevent memory leaks
    if (this.tokenCache.size >= this.config.uniqueTokenPerInterval) {
      // Remove oldest entries (simple LRU-like behavior)
      const oldestKey = this.tokenCache.keys().next().value
      if (oldestKey) {
        this.tokenCache.delete(oldestKey)
      }
    }

    // Check if limit exceeded
    const isAllowed = validTokens.length < limit

    if (isAllowed) {
      validTokens.push(now)
      this.tokenCache.set(identifier, validTokens)
    }

    const reset = Math.floor((windowStart + this.config.interval) / 1000)

    return {
      success: isAllowed,
      limit,
      remaining: Math.max(0, limit - validTokens.length - (isAllowed ? 1 : 0)),
      reset,
    }
  }

  /**
   * Clear all rate limit data for a specific identifier
   * Useful for testing or manual resets
   */
  reset(identifier: string): void {
    this.tokenCache.delete(identifier)
  }

  /**
   * Clear all rate limit data
   * Useful for testing
   */
  resetAll(): void {
    this.tokenCache.clear()
  }
}

/**
 * Create a rate limiter instance
 */
export function rateLimit(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}

/**
 * Get identifier from request (IP address or fallback)
 * Handles various proxy headers
 */
export function getIdentifier(request: Request): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Authentication endpoints (stricter limits)
export const authRateLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 1000,
})

// Payment endpoints (very strict)
export const paymentRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

// General API endpoints (moderate limits)
export const apiRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
})

// Webhook endpoints (lenient for legitimate services)
export const webhookRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
})
