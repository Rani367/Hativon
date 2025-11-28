import { sql } from "@vercel/postgres";
import { Pool } from "pg";

/**
 * Database client wrapper that works with both local PostgreSQL and Vercel Postgres
 * - Local: Uses standard pg package with POSTGRES_URL
 * - Production: Uses @vercel/postgres with WebSocket connection
 */

// Detect if we're in Vercel production environment
const isVercelProduction = process.env.VERCEL_ENV === "production";

// Create local PostgreSQL pool for development
let localPool: Pool | null = null;

function getLocalPool(): Pool {
  if (!localPool && process.env.POSTGRES_URL) {
    localPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error if connection takes more than 2 seconds
    });
  }
  return localPool!;
}

/**
 * Database query function that adapts to environment
 * Supports both template literal and array syntax
 */
export const db = {
  query: async (
    strings:
      | TemplateStringsArray
      | (string | number | boolean | string[] | null)[],
    ...values: unknown[]
  ) => {
    // Handle array syntax: [query, ...params]
    if (
      Array.isArray(strings) &&
      typeof strings[0] === "string" &&
      !("raw" in strings)
    ) {
      const [queryString, ...params] = strings;

      if (isVercelProduction) {
        // For Vercel, we need to use parameterized query
        const pool = getLocalPool();
        if (!pool) {
          throw new Error("Database connection not configured");
        }
        return pool.query(queryString, params);
      }

      // For local, use pg directly
      const pool = getLocalPool();
      if (!pool) {
        throw new Error(
          "Database connection not configured. Set POSTGRES_URL in .env.local",
        );
      }
      return pool.query(queryString, params);
    }

    // Handle template literal syntax
    const templateStrings = strings as TemplateStringsArray;

    // In Vercel production, use @vercel/postgres
    if (isVercelProduction) {
      // @vercel/postgres sql function accepts primitive types (string, number, boolean, null)
      // Cast unknown[] to supported types
      return sql(
        templateStrings,
        ...(values as (string | number | boolean | null)[]),
      );
    }

    // In local development, use standard pg
    const pool = getLocalPool();
    if (!pool) {
      throw new Error(
        "Database connection not configured. Set POSTGRES_URL in .env.local",
      );
    }

    // Convert template literal to SQL query
    const query = templateStrings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : "");
    }, "");

    // pg library accepts any primitive types as values
    const result = await pool.query(
      query,
      values as (string | number | boolean | null)[],
    );
    return result;
  },
};

/**
 * Helper function to check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
      return false;
    }

    if (isVercelProduction) {
      await sql`SELECT 1`;
    } else {
      const pool = getLocalPool();
      if (!pool) return false;
      await pool.query("SELECT 1");
    }

    return true;
  } catch (error) {
    console.error("Database not available:", error);
    return false;
  }
}
