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
    // 'ABACATEPAY_API_KEY', // Optional depending on feature flags, but good to have
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
}
