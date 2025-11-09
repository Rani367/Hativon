import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { head } from '@vercel/blob';

/**
 * One-time setup endpoint for Vercel production
 *
 * This endpoint:
 * 1. Initializes the database schema (creates posts + users tables)
 * 2. Migrates existing posts from Blob storage to PostgreSQL
 *
 * Usage:
 * - After first deployment to Vercel, visit: https://yourdomain.com/api/setup?password=YOUR_ADMIN_PASSWORD
 * - Only works once - subsequent calls will report "already initialized"
 * - Requires ADMIN_PASSWORD as query parameter for security
 */

const BLOB_FILENAME = 'posts.json';

export async function GET(request: NextRequest) {
  try {
    // Security: Require admin password
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide ?password=YOUR_ADMIN_PASSWORD' },
        { status: 401 }
      );
    }

    const logs: string[] = [];
    logs.push('🚀 Starting database setup...\n');

    // Step 1: Check if already initialized
    try {
      const checkResult = await db.query`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'posts'
        ) as posts_exists,
        EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) as users_exists;
      ` as any;

      const { posts_exists, users_exists } = checkResult.rows[0];

      if (posts_exists && users_exists) {
        logs.push('ℹ️  Database already initialized');

        // Check if posts exist
        const countResult = await db.query`SELECT COUNT(*) as count FROM posts` as any;
        const postCount = parseInt(countResult.rows[0].count);

        logs.push(`📊 Current posts in database: ${postCount}`);

        return NextResponse.json({
          success: true,
          alreadyInitialized: true,
          message: 'Database already set up',
          postCount,
          logs,
        });
      }
    } catch (error) {
      logs.push('📝 Tables do not exist yet, will create them...');
    }

    // Step 2: Initialize database schema
    logs.push('\n📦 Creating database tables...');

    const schemaPath = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema (split by semicolon for Vercel Postgres)
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query([statement] as any);
      }
    }

    logs.push('✅ Database tables created successfully');

    // Step 3: Migrate posts from Blob storage (if exists)
    logs.push('\n📥 Checking for existing posts in Blob storage...');

    let migratedCount = 0;
    try {
      const metadata = await head(BLOB_FILENAME);
      const response = await fetch(metadata.url, { cache: 'no-store' });

      if (response.ok) {
        const text = await response.text();
        const posts = JSON.parse(text);

        logs.push(`Found ${posts.length} posts in Blob storage`);

        if (posts.length > 0) {
          logs.push('📝 Migrating posts to PostgreSQL...');

          for (const post of posts) {
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
              migratedCount++;
              logs.push(`  ✓ ${post.title}`);
            } catch (error: any) {
              logs.push(`  ⚠️  Skipped "${post.title}": ${error.message}`);
            }
          }

          logs.push(`\n✅ Migrated ${migratedCount} posts successfully`);
        }
      } else {
        logs.push('ℹ️  No posts found in Blob storage');
      }
    } catch (error) {
      logs.push('ℹ️  No Blob storage configured or no posts to migrate');
    }

    // Step 4: Summary
    logs.push('\n✅ Setup complete!');
    logs.push('\n📝 Next steps:');
    logs.push('  1. You can now delete this /api/setup route (optional)');
    logs.push('  2. Users can register at /register');
    logs.push('  3. Access admin panel at /admin');
    logs.push('  4. Posts are now stored in PostgreSQL with immediate consistency!');

    return NextResponse.json({
      success: true,
      alreadyInitialized: false,
      migratedPosts: migratedCount,
      logs,
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
