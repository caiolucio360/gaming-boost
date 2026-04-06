/**
 * Next.js Instrumentation Hook
 * Runs once at server startup (Node.js runtime only)
 * Used for startup validation and initialization
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./src/lib/env')
    validateEnv()
  }
}
