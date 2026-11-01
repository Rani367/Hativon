#!/usr/bin/env bun
/**
 * Applies db/migrations/*.sql in order, each in its own transaction, and records
 * them in schema_migrations. The old app's `migrations` table is left alone.
 *
 *   bun run db:migrate           apply everything pending
 *   bun run db:migrate --status  show what is pending
 *
 * Runs by hand only, never during a build. Bun loads .env.local, which points at
 * a Neon branch. Production is refused unless ALLOW_PRODUCTION_MIGRATION=yes.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { fingerprintDatabase } from "@/lib/env";
import { assertSafeTarget, findPending } from "@/lib/migrations";

const MIGRATIONS_DIR = path.join(import.meta.dir, "..", "db", "migrations");

// Arbitrary but fixed, so two runs can't apply migrations at the same time.
const ADVISORY_LOCK_ID = 7_391_039;

// A Postgres connection takes several round trips, so on a slow link such as a
// phone hotspot a single attempt can take 15 seconds or be dropped outright.
const CONNECT_TIMEOUT_MS = 30_000;
const CONNECT_ATTEMPTS = 3;

async function connect(url: string): Promise<Client> {
  // verify-full is what pg already does for "require", and saying so silences
  // its warning about that meaning changing in a future version.
  const connectionString = url.replace(
    "sslmode=require",
    "sslmode=verify-full",
  );

  for (let attempt = 1; ; attempt += 1) {
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.end().catch(() => {});
      if (attempt === CONNECT_ATTEMPTS) throw error;
      console.log(`Connection attempt ${attempt} failed, retrying`);
    }
  }
}

async function main() {
  const url =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL ?? "";
  if (!url) throw new Error("POSTGRES_URL_NON_POOLING is not set");

  const fingerprint = fingerprintDatabase(url);
  assertSafeTarget(
    fingerprint,
    process.env.ALLOW_PRODUCTION_MIGRATION === "yes",
  );

  const statusOnly = process.argv.includes("--status");
  const client = await connect(url);

  try {
    console.log(`Database ${fingerprint}`);

    await client.query("SELECT pg_advisory_lock($1)", [ADVISORY_LOCK_ID]);
    // A migration that can't get its lock quickly must fail, not queue up and
    // block every reader behind it.
    await client.query("SET lock_timeout = '5s'");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const applied = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations",
    );
    const pending = findPending(
      readdirSync(MIGRATIONS_DIR),
      applied.rows.map((row) => row.id),
    );

    if (pending.length === 0) {
      console.log("Nothing pending");
      return;
    }

    for (const migration of pending) {
      if (statusOnly) {
        console.log(`Pending ${migration.filename}`);
        continue;
      }

      const sql = readFileSync(
        path.join(MIGRATIONS_DIR, migration.filename),
        "utf8",
      );

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (id, name) VALUES ($1, $2)",
          [migration.id, migration.name],
        );
        await client.query("COMMIT");
        console.log(`Applied ${migration.filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
