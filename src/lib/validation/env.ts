/**
 * Environment variable validation at startup
 * Validates critical environment variables and provides helpful error messages
 */

import { z } from "zod";

/**
 * Comprehensive environment validation schema
 */
const envSchema = z.object({
  // Required for security
  JWT_SECRET: z
    .string()
    .min(
      32,
      "JWT_SECRET must be at least 32 characters for security. Generate with: openssl rand -base64 32",
    ),

  ADMIN_PASSWORD: z
    .string()
    .min(8, "ADMIN_PASSWORD should be at least 8 characters for security"),

  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url(
      "NEXT_PUBLIC_SITE_URL must be a valid URL (e.g., http://localhost:3000 or https://yourdomain.com)",
    ),

  // Optional but validated if present
  POSTGRES_URL: z
    .string()
    .url("POSTGRES_URL must be a valid PostgreSQL connection string")
    .optional(),

  POSTGRES_URL_NON_POOLING: z
    .string()
    .url(
      "POSTGRES_URL_NON_POOLING must be a valid PostgreSQL connection string",
    )
    .optional(),

  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  SESSION_DURATION: z
    .string()
    .regex(/^\d+$/, "SESSION_DURATION must be a number (seconds)")
    .transform(Number)
    .refine((val) => val >= 3600 && val <= 2592000, {
      message:
        "SESSION_DURATION should be between 1 hour (3600) and 30 days (2592000)",
    })
    .optional(),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
});

/**
 * Parsed and validated environment variables
 */
export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup
 * Throws detailed error if validation fails
 */
export function validateEnv(): ValidatedEnv {
  const env = {
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    SESSION_DURATION: process.env.SESSION_DURATION,
    NODE_ENV: process.env.NODE_ENV,
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.issues.map((err) => {
      const field = err.path.join(".");
      return `  - ${field}: ${err.message}`;
    });

    console.error("[ERROR] Environment validation failed:");
    console.error(errors.join("\n"));
    console.error(
      "\nPlease check your .env.local file and ensure all required variables are set correctly.",
    );
    console.error("See .env.example for reference.");

    throw new Error(
      "Environment validation failed. Check logs above for details.",
    );
  }

  // Log successful validation (only in development)
  if (result.data.NODE_ENV === "development") {
    console.log("[OK] Environment variables validated successfully");

    // Log warnings for optional but recommended variables
    if (!result.data.POSTGRES_URL) {
      console.log(
        "[WARNING] POSTGRES_URL not set - running in admin-only mode (no user authentication)",
      );
    }

    if (!result.data.BLOB_READ_WRITE_TOKEN) {
      console.log(
        "[INFO] BLOB_READ_WRITE_TOKEN not set - image uploads will use base64 encoding",
      );
    }
  }

  return result.data;
}

/**
 * Cached validated environment
 * Only validate once per process
 */
let cachedEnv: ValidatedEnv | null = null;

/**
 * Get validated environment variables
 * Validates on first call, then returns cached result
 */
export function getEnv(): ValidatedEnv {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}
