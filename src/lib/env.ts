/**
 * Environment Variables Validator
 * Ensures that all critical environment variables are present at startup
 */

const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_API_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    // 'ABACATEPAY_API_KEY', // Optional in dev, required in prod
    // 'RESEND_API_KEY', // Optional in dev, required in prod
]

const optionalButRecommended = [
    'ABACATEPAY_API_KEY',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'ORDER_TIMEOUT_HOURS',
]

export function validateEnv() {
    const missing = requiredEnvVars.filter((key) => !process.env[key])

    if (missing.length > 0) {
        throw new Error(
            `FATAL: Missing required environment variables: ${missing.join(', ')}`
        )
    }

    // Validate ENCRYPTION_KEY length specifically
    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
        throw new Error('FATAL: ENCRYPTION_KEY must be exactly 64 hex characters')
    }

    // Validate ORDER_TIMEOUT_HOURS is a valid positive number
    if (process.env.ORDER_TIMEOUT_HOURS) {
        const timeoutHours = parseInt(process.env.ORDER_TIMEOUT_HOURS, 10)
        if (isNaN(timeoutHours) || timeoutHours <= 0) {
            throw new Error('FATAL: ORDER_TIMEOUT_HOURS must be a positive number')
        }
    }

    // Warn about missing optional variables in production
    if (process.env.NODE_ENV === 'production') {
        const missingOptional = optionalButRecommended.filter((key) => !process.env[key])
        if (missingOptional.length > 0) {
            console.warn(
                `⚠️  WARNING: Missing recommended environment variables for production: ${missingOptional.join(', ')}`
            )
        }
    }

    // In development, provide helpful defaults
    if (process.env.NODE_ENV === 'development') {
        if (!process.env.EMAIL_FROM) {
            console.log('ℹ️  Using default EMAIL_FROM: GameBoost <noreply@gameboost.com.br>')
        }
        if (!process.env.RESEND_API_KEY) {
            console.log('ℹ️  RESEND_API_KEY not set - emails will be logged to console')
        }
        if (!process.env.ORDER_TIMEOUT_HOURS) {
            console.log('ℹ️  ORDER_TIMEOUT_HOURS not set - auto-refund will be disabled')
        }
    }
}

/**
 * Get the configured order timeout in hours
 * Returns null if not configured
 */
export function getOrderTimeoutHours(): number | null {
    const timeoutHours = process.env.ORDER_TIMEOUT_HOURS
    if (!timeoutHours) return null

    const parsed = parseInt(timeoutHours, 10)
    return isNaN(parsed) ? null : parsed
}
