#!/usr/bin/env ts-node

/**
 * Posts Migration Script
 *
 * This script migrates existing posts from Blob storage or local JSON file to PostgreSQL.
 * Run this ONCE after running db:init to populate the posts table.
 *
 * Usage:
 *   pnpm run migrate-posts
 *   or: pnpm exec tsx scripts/migrate-posts-to-db.ts
 *
 * Requirements:
 *   - Database must be initialized (run pnpm run db:init first)
 *   - Either BLOB_READ_WRITE_TOKEN (for Vercel) or local data/posts.json file must exist
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { head } from '@vercel/blob';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../src/lib/db/client';
import { Post } from '../src/types/post.types';

const BLOB_FILENAME = 'posts.json';
const LOCAL_DATA_FILE = join(process.cwd(), 'data', 'posts.json');
const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN;

async function readPostsFromOldStorage(): Promise<Post[]> {
  try {
    if (isVercel) {
      console.log('📥 Reading posts from Vercel Blob storage...');
      try {
        const metadata = await head(BLOB_FILENAME);
        const response = await fetch(metadata.url, { cache: 'no-store' });

        if (!response.ok) {
          console.log('⚠️  No posts found in Blob storage');
          return [];
        }

        const text = await response.text();
        const posts = JSON.parse(text);
        console.log(`✓ Found ${posts.length} posts in Blob storage`);
        return posts;
      } catch (error) {
        console.log('⚠️  No posts found in Blob storage (blob may not exist yet)');
        return [];
      }
    } else {
      console.log('📥 Reading posts from local JSON file...');
      if (!existsSync(LOCAL_DATA_FILE)) {
        console.log('⚠️  No local posts.json file found');
        return [];
      }

      const data = readFileSync(LOCAL_DATA_FILE, 'utf-8');
      const posts = JSON.parse(data);
      console.log(`✓ Found ${posts.length} posts in local file`);
      return posts;
    }
  } catch (error) {
    console.error('❌ Error reading old posts:', error);
    return [];
  }
}

async function migratePostToDatabase(post: Post): Promise<boolean> {
  try {
    await db.query`
      INSERT INTO posts (
        id, title, slug, content, cover_image, description,
        date, author, author_id, author_grade, author_class,
        tags, category, status, created_at, updated_at
      )
      VALUES (
        ${post.id},
        ${post.title},
        ${post.slug},
        ${post.content},
        ${post.coverImage || null},
        ${post.description},
        ${new Date(post.date)},
        ${post.author || null},
        ${post.authorId || null},
        ${post.authorGrade || null},
        ${post.authorClass || null},
        ${post.tags || []},
        ${post.category || null},
        ${post.status},
        ${new Date(post.createdAt)},
        ${new Date(post.updatedAt)}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    return true;
  } catch (error) {
    console.error(`  ❌ Error migrating post "${post.title}":`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting posts migration to PostgreSQL...\n');

  try {
    // Check if posts table exists
    const tableCheck = await db.query`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'posts'
      );
    ` as any;

    if (!tableCheck.rows[0]?.exists) {
      console.error('❌ Posts table does not exist!');
      console.log('   Please run: pnpm run db:init\n');
      process.exit(1);
    }

    // Read posts from old storage
    const posts = await readPostsFromOldStorage();

    if (posts.length === 0) {
      console.log('\n✅ No posts to migrate. Database is ready for new posts!');
      process.exit(0);
    }

    // Migrate each post
    console.log(`\n📝 Migrating ${posts.length} posts to PostgreSQL...\n`);
    let successCount = 0;
    let skipCount = 0;

    for (const post of posts) {
      const success = await migratePostToDatabase(post);
      if (success) {
        successCount++;
        console.log(`  ✓ ${post.title}`);
      } else {
        skipCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   ✓ Successfully migrated: ${successCount} posts`);
    if (skipCount > 0) {
      console.log(`   ⚠️  Skipped (already exist): ${skipCount} posts`);
    }

    console.log('\n📝 Next steps:');
    console.log('   1. Test the application: pnpm run dev');
    console.log('   2. Verify posts are visible in the UI');
    console.log('   3. Deploy to Vercel (posts will be in PostgreSQL)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure database is initialized: pnpm run db:init');
    console.log('   - Check POSTGRES_URL is set in .env.local');
    console.log('   - Verify database is accessible\n');
    process.exit(1);
  }
}

main();
