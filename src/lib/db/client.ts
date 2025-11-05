import { sql } from '@vercel/postgres';
import { Pool } from 'pg';

/**
 * Database client wrapper that works with both local PostgreSQL and Vercel Postgres
 * - Local: Uses standard pg package with POSTGRES_URL
 * - Production: Uses @vercel/postgres with WebSocket connection
 */

// Detect if we're in Vercel production environment
const isVercelProduction = process.env.VERCEL_ENV === 'production';

// Create local PostgreSQL pool for development
let localPool: Pool | null = null;

function getLocalPool(): Pool {
  if (!localPool && process.env.POSTGRES_URL) {
    localPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });
  }
  return localPool!;
}

/**
 * Database query function that adapts to environment
 */
export const db = {
  query: async (strings: TemplateStringsArray, ...values: any[]) => {
    // In Vercel production, use @vercel/postgres
    if (isVercelProduction) {
      return sql(strings, ...values);
    }

    // In local development, use standard pg
    const pool = getLocalPool();
    if (!pool) {
      throw new Error('Database connection not configured. Set POSTGRES_URL in .env.local');
    }

    // Convert template literal to SQL query
    const query = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : '');
    }, '');

    const result = await pool.query(query, values);
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
      await pool.query('SELECT 1');
    }

    return true;
  } catch (error) {
    console.error('Database not available:', error);
    return false;
  }
}

/**
 * Clean up database connections (call this when shutting down)
 */
export async function closeDatabase(): Promise<void> {
  if (localPool) {
    await localPool.end();
    localPool = null;
  }
}
