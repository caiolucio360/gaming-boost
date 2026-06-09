/**
 * Rate Limit Configuration
 *
 * Named constants for all rate limit maximums used across API routes.
 * Eliminates magic numbers and provides a single source of truth.
 */

export const RateLimits = {
  /** Auth: login attempts per 15-minute window */
  AUTH_LOGIN: 5,

  /** Auth: registration attempts per 15-minute window */
  AUTH_REGISTER: 3,

  /** Auth: forgot-password requests per 15-minute window */
  AUTH_FORGOT_PASSWORD: 3,

  /** Auth: email verification resend per 15-minute window */
  AUTH_RESEND_CODE: 3,

  /** Auth: email verification code submissions per 15-minute window */
  AUTH_VERIFY: 5,

  /** Auth: reset-password submissions per 15-minute window */
  AUTH_RESET_PASSWORD: 5,

  /** Orders: creation attempts per minute */
  ORDER_CREATE: 10,

  /** Orders: cancellation attempts per minute */
  ORDER_CANCEL: 5,

  /** Payment: PIX generation attempts per minute */
  PAYMENT_PIX: 5,

  /** Chat: messages per minute per user per order */
  CHAT_MESSAGE: 30,
} as const

export type RateLimitKey = keyof typeof RateLimits
