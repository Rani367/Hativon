/**
 * Rules for scripts/migrate.ts, kept apart from the database so they can be
 * tested. Production holds another app's tables too, so the runner is
 * deliberately hard to point at it by accident.
 */

/** One-way fingerprint of the production database host. See fingerprintDatabase. */
export const PRODUCTION_DATABASE_FINGERPRINT = "4486cf09fa0b";

export interface Migration {
  id: string;
  name: string;
  filename: string;
}

/** Reads "0003_teacher_hold.sql" into its parts, or null if it isn't a migration. */
export function parseMigrationFilename(filename: string): Migration | null {
  const match = /^(\d{4})_([a-z0-9_]+)\.sql$/.exec(filename);
  if (!match) return null;
  return { id: match[1], name: match[2], filename };
}

/** The migrations still to run, in order. */
export function findPending(
  filenames: string[],
  appliedIds: Iterable<string>,
): Migration[] {
  const applied = new Set(appliedIds);
  const seen = new Set<string>();

  return filenames
    .map(parseMigrationFilename)
    .filter((migration): migration is Migration => migration !== null)
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter((migration) => {
      if (seen.has(migration.id)) {
        throw new Error(`Two migrations share the id ${migration.id}`);
      }
      seen.add(migration.id);
      return !applied.has(migration.id);
    });
}

/** Throws unless this database may be migrated from this run. */
export function assertSafeTarget(
  fingerprint: string,
  allowProduction: boolean,
): void {
  if (fingerprint === PRODUCTION_DATABASE_FINGERPRINT && !allowProduction) {
    throw new Error(
      "This is the production database. Migrations reach it only during " +
        "cutover, with ALLOW_PRODUCTION_MIGRATION=yes.",
    );
  }
}
