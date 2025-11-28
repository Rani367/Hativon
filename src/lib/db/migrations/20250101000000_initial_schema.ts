/**
 * Migration: Initial database schema
 * Created: 2025-01-01
 *
 * Creates the initial tables for the school newspaper application:
 * - users: User accounts and profiles
 * - posts: Blog posts and articles
 */

import { db } from '../client';
import type { Migration } from './index';

const migration: Migration = {
  id: '20250101000000',
  name: 'initial_schema',

  async up() {
    // Create users table
    await db.query`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        grade VARCHAR(2) CHECK (grade IN ('ז', 'ח', 'ט', 'י')),
        class_number INTEGER CHECK (class_number BETWEEN 1 AND 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `;

    // Create posts table
    await db.query`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        cover_image TEXT,
        description VARCHAR(500),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        author VARCHAR(100),
        author_id VARCHAR(255),
        author_grade VARCHAR(2),
        author_class INTEGER,
        tags TEXT[],
        category VARCHAR(100),
        status VARCHAR(20) CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better query performance
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;

    console.log('[MIGRATION] Created users and posts tables');
  },

  async down() {
    // Drop tables in reverse order
    await db.query`DROP TABLE IF EXISTS posts CASCADE`;
    await db.query`DROP TABLE IF EXISTS users CASCADE`;

    console.log('[MIGRATION] Dropped users and posts tables');
  },
};

export default migration;
