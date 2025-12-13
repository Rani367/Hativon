export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { getEnv } = await import("@/lib/validation/env");
      getEnv();
      console.log("[OK] Environment validation passed");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[FATAL] Invalid environment configuration:", message);
      process.exit(1);
    }
  }
}
