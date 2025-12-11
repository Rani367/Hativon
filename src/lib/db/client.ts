import { sql } from "@vercel/postgres";
import { Pool } from "pg";

// Adapts between vercel postgres (prod) and local pg (dev)

const isVercelProduction = process.env.VERCEL_ENV === "production";

let localPool: Pool | null = null;

function getLocalPool(): Pool {
  if (!localPool && process.env.POSTGRES_URL) {
    localPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return localPool!;
}

export const db = {
  query: async (
    strings:
      | TemplateStringsArray
      | (string | number | boolean | string[] | null)[],
    ...values: unknown[]
  ) => {
    // array syntax: [query, ...params]
    if (
      Array.isArray(strings) &&
      typeof strings[0] === "string" &&
      !("raw" in strings)
    ) {
      const [queryString, ...params] = strings;

      if (isVercelProduction) {
        const pool = getLocalPool();
        if (!pool) {
          throw new Error("Database connection not configured");
        }
        return pool.query(queryString, params);
      }

      const pool = getLocalPool();
      if (!pool) {
        throw new Error(
          "Database connection not configured. Set POSTGRES_URL in .env.local",
        );
      }
      return pool.query(queryString, params);
    }

    // template literal syntax
    const templateStrings = strings as TemplateStringsArray;

    if (isVercelProduction) {
      return sql(
        templateStrings,
        ...(values as (string | number | boolean | null)[]),
      );
    }

    const pool = getLocalPool();
    if (!pool) {
      throw new Error(
        "Database connection not configured. Set POSTGRES_URL in .env.local",
      );
    }

    // convert template literal to parameterized query
    const query = templateStrings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : "");
    }, "");

    const result = await pool.query(
      query,
      values as (string | number | boolean | null)[],
    );
    return result;
  },
};

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
