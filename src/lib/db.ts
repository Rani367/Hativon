import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/env";

let client: NeonQueryFunction<false, false> | null = null;

/**
 * The SQL client, used as a tagged template: await db()`SELECT 1`.
 *
 * Queries reject on failure and callers must let that happen. Catching a
 * database error and returning an empty result is what let an outage get cached
 * as an empty issue in the old app.
 */
export function db(): NeonQueryFunction<false, false> {
  if (client) return client;

  const url = getDatabaseUrl();
  if (!url) throw new Error("POSTGRES_URL is not set");

  client = neon(url);
  return client;
}
