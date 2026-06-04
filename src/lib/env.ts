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
    'ABACATEPAY_WEBHOOK_SECRET',
    'CRON_SECRET',
    // 'ABACATEPAY_API_KEY', // Optional in dev, required in prod
    // 'RESEND_API_KEY', // Optional in dev, required in prod
]

const optionalButRecommended = [
    'ABACATEPAY_API_KEY',
    'ASAAS_API_KEY',
    'ASAAS_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'ORDER_TIMEOUT_HOURS',
    'BLOB_READ_WRITE_TOKEN',
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

    // Validate ASAAS_API_KEY format.
    // Asaas keys always start with "$aact_" (sandbox: "$aact_hmlg_", prod: "$aact_prod_").
    // Common pitfall: the leading "$" is eaten by dotenv/@next/env variable expansion when
    // it isn't escaped in a .env file (use "\$aact_..."), leaving the value empty or mangled —
    // which makes the app "fail to read the key". Surface this loudly at startup instead of
    // only discovering it when a PIX charge silently fails.
    const asaasKey = process.env.ASAAS_API_KEY
    if (asaasKey && !asaasKey.startsWith('$aact_')) {
        console.warn(
            '⚠️  WARNING: ASAAS_API_KEY is set but does not start with "$aact_" — it looks invalid or mangled.\n' +
            '   • Expected: "$aact_hmlg_..." (sandbox) or "$aact_prod_..." (production).\n' +
            '   • In .env files, escape the leading "$" as "\\$" so it is not expanded.\n' +
            '   • In the Vercel dashboard, paste the key literally (no backslash).'
        )
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
            console.log('ℹ️  Using default EMAIL_FROM: FlautasBoost <noreply@flautasboost.com.br>')
        }
        if (!process.env.RESEND_API_KEY) {
            console.log('ℹ️  RESEND_API_KEY not set - emails will be logged to console')
        }
        if (!process.env.ORDER_TIMEOUT_HOURS) {
            console.log('ℹ️  ORDER_TIMEOUT_HOURS not set - auto-refund will be disabled')
        }
        if (!process.env.ASAAS_API_KEY) {
            console.log('ℹ️  ASAAS_API_KEY not set - real Asaas PIX charges will fail; use the dev "simulate payment" button')
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
