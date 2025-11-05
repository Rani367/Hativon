import { db } from './client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

/**
 * Initialize database schema
 * Run this once to create tables and indexes
 *
 * Usage:
 * - Development: Run `npm run db:init` or call this function
 * - Production: Run once after enabling Vercel Postgres
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Read schema file
    const schemaPath = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // For local development, use direct pool to execute multi-statement SQL
    if (process.env.VERCEL_ENV !== 'production' && process.env.POSTGRES_URL) {
      const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
      await pool.query(schema);
      await pool.end();
    } else {
      // For production, execute each statement separately
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await db.query([statement] as any);
        }
      }
    }

    console.log('✓ Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Check if users table exists
 */
export async function checkDatabaseSetup(): Promise<boolean> {
  try {
    const result = await db.query`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    ` as any;
    return result.rows[0]?.exists || false;
  } catch (error) {
    console.error('Error checking database setup:', error);
    return false;
  }
}

// If run directly (for development)
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
