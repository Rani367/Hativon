/**
 * Safe wrappers for Next.js cache revalidation functions.
 *
 * In Next.js 16, revalidateTag and revalidatePath throw if called outside
 * a request context with an incremental cache (e.g., during certain API calls
 * or when the async storage store is unavailable). These wrappers catch those
 * errors so that cache revalidation failures never cause the parent operation
 * (like saving a post to the database) to fail.
 */

import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Safely call revalidateTag without throwing on failure.
 * Logs a warning if revalidation fails, but lets the caller continue.
 */
export function safeRevalidateTag(...args: Parameters<typeof revalidateTag>) {
  try {
    revalidateTag(...args);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.warn(
      `[WARNING] Cache revalidateTag("${args[0]}") failed: ${message}`,
    );
  }
}

/**
 * Safely call revalidatePath without throwing on failure.
 * Logs a warning if revalidation fails, but lets the caller continue.
 */
export function safeRevalidatePath(...args: Parameters<typeof revalidatePath>) {
  try {
    revalidatePath(...args);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.warn(
      `[WARNING] Cache revalidatePath("${args[0]}") failed: ${message}`,
    );
  }
}
