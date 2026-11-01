import { createHash } from "node:crypto";

/** The database connection string, or null when this environment has none. */
export function getDatabaseUrl(): string | null {
  return process.env.POSTGRES_URL || null;
}

/**
 * A one-way fingerprint of the database host, so two deployments can be
 * compared without revealing either host. Pooled and direct connections to the
 * same database share a fingerprint.
 */
export function fingerprintDatabase(url: string): string {
  const host = new URL(url).hostname.replace("-pooler", "");
  return createHash("sha256").update(host).digest("hex").slice(0, 12);
}
