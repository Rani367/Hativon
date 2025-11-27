/**
 * Next.js instrumentation file
 * Runs once when the Next.js server starts (before any requests)
 * Perfect for validating environment variables at startup
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate environment variables at startup
    const { validateEnv } = await import('./src/lib/validation/env');
    validateEnv();
  }
}
