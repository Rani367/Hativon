import { db } from "./client";
import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

/**
 * Initialize database schema
 * Run this once to create tables and indexes
 *
 * Usage:
 * - Development: Run `pnpm run db:init` or call this function
 * - Production: Run once after enabling Vercel Postgres
 */
export async function initializeDatabase(silent = false) {
  try {
    if (!silent) {
      console.log("Initializing database...");
    }

    // Read schema file
    const schemaPath = join(process.cwd(), "src", "lib", "db", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // For local development, use direct pool to execute multi-statement SQL
    if (process.env.VERCEL_ENV !== "production" && process.env.POSTGRES_URL) {
      const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
      await pool.query(schema);
      await pool.end();
    } else {
      // For production, execute each statement separately
      const statements = schema.split(";").filter((stmt) => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await db.query([statement]);
        }
      }
    }

    if (!silent) {
      console.log(" Database initialized successfully");
    }
    return { success: true };
  } catch (error) {
    if (!silent) {
      console.error(" Database initialization failed:", error);
    }
    throw error;
  }
}

interface DatabaseSetupCheckResult {
  users_exists: boolean;
  posts_exists: boolean;
}

/**
 * Check if database tables exist
 */
export async function checkDatabaseSetup(): Promise<boolean> {
  try {
    const result = await db.query`
      SELECT
        EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) as users_exists,
        EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'posts'
        ) as posts_exists;
    `;
    const row = result.rows[0] as DatabaseSetupCheckResult | undefined;
    return (row?.users_exists && row?.posts_exists) || false;
  } catch (error) {
    console.error("Error checking database setup:", error);
    return false;
  }
}

// If run directly (for development)
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
