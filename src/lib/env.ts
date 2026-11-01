/** The database connection string, or null when this environment has none. */
export function getDatabaseUrl(): string | null {
  return process.env.POSTGRES_URL || null;
}
