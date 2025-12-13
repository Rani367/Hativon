import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { head } from "@vercel/blob";
import { logError } from "@/lib/logger";
import { createRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { verifyAdminPassword } from "@/lib/auth/admin";

/**
 * One-time setup endpoint for Vercel production
 *
 * This endpoint:
 * 1. Initializes the database schema (creates posts + users tables)
 * 2. Migrates existing posts from Blob storage to PostgreSQL
 *
 * Usage:
 * - After first deployment to Vercel, POST to: https://yourdomain.com/api/setup
 * - Body: { "password": "YOUR_ADMIN_PASSWORD" }
 * - Only works once - subsequent calls will report "already initialized"
 * - Rate limited: 3 attempts per hour
 */

const BLOB_FILENAME = "posts.json";

// Rate limiter: 3 attempts per hour
const setupRateLimiter = createRateLimiter({
  limit: 3,
  window: 60 * 60 * 1000, // 1 hour
});

export async function POST(request: NextRequest) {
  // Setup route is disabled by default - must be explicitly enabled
  if (process.env.ENABLE_SETUP_ROUTE !== "true") {
    return NextResponse.json(
      {
        error:
          "Setup route is disabled. Set ENABLE_SETUP_ROUTE=true to enable.",
      },
      { status: 403 },
    );
  }

  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await setupRateLimiter.check(`setup:${identifier}`);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many setup attempts. Try again later." },
        { status: 429 },
      );
    }

    // Security: Require admin password in request body
    let body: { password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body. Expected: { password: string }" },
        { status: 400 },
      );
    }

    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required in request body" },
        { status: 400 },
      );
    }

    // Use secure password verification (constant-time comparison)
    const isValidPassword = await verifyAdminPassword(password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid admin password" },
        { status: 401 },
      );
    }

    const logs: string[] = [];
    logs.push("[SETUP] Starting database setup...\n");

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
      `;

      const { posts_exists, users_exists } = checkResult.rows[0] as {
        posts_exists: boolean;
        users_exists: boolean;
      };

      if (posts_exists && users_exists) {
        logs.push("[INFO]  Database already initialized");

        // Check if posts exist
        const countResult = await db.query`SELECT COUNT(*) as count FROM posts`;
        const postCount = parseInt(String(countResult.rows[0].count));

        logs.push(` Current posts in database: ${postCount}`);

        return NextResponse.json({
          success: true,
          alreadyInitialized: true,
          message: "Database already set up",
          postCount,
          logs,
        });
      }
    } catch (error) {
      logs.push("[INFO] Tables do not exist yet, will create them...");
    }

    // Step 2: Initialize database schema
    logs.push("\n[INFO] Creating database tables...");

    // Create users table
    await db.query`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        grade VARCHAR(10) NOT NULL CHECK (grade IN ('ז', 'ח', 'ט', 'י')),
        class_number INTEGER NOT NULL CHECK (class_number >= 1 AND class_number <= 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `;

    // Create posts table
    await db.query`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        cover_image TEXT,
        description TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        author TEXT,
        author_id TEXT,
        author_grade VARCHAR(10),
        author_class INTEGER,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        category TEXT,
        status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await db.query`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`;
    await db.query`CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC)`;

    // Create trigger function
    await db.query`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Create triggers
    await db.query`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users
    `;
    await db.query`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await db.query`
      DROP TRIGGER IF EXISTS update_posts_updated_at ON posts
    `;
    await db.query`
      CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    logs.push("[OK] Database tables created successfully");

    // Step 3: Migrate posts from Blob storage (if exists)
    logs.push("\n Checking for existing posts in Blob storage...");

    let migratedCount = 0;
    try {
      const metadata = await head(BLOB_FILENAME);
      const response = await fetch(metadata.url, { cache: "no-store" });

      if (response.ok) {
        const text = await response.text();
        const posts = JSON.parse(text);

        logs.push(`Found ${posts.length} posts in Blob storage`);

        if (posts.length > 0) {
          logs.push("[INFO] Migrating posts to PostgreSQL...");

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
              logs.push(`  [OK] ${post.title}`);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              logs.push(
                `  [WARNING]  Skipped "${post.title}": ${errorMessage}`,
              );
            }
          }

          logs.push(`\n[OK] Migrated ${migratedCount} posts successfully`);
        }
      } else {
        logs.push("[INFO]  No posts found in Blob storage");
      }
    } catch (error) {
      logs.push("[INFO]  No Blob storage configured or no posts to migrate");
    }

    // Step 4: Summary
    logs.push("\n[OK] Setup complete!");
    logs.push("\n[INFO] Next steps:");
    logs.push("  1. You can now delete this /api/setup route (optional)");
    logs.push("  2. Users can register at /register");
    logs.push("  3. Access admin panel at /admin");
    logs.push(
      "  4. Posts are now stored in PostgreSQL with immediate consistency!",
    );

    return NextResponse.json({
      success: true,
      alreadyInitialized: false,
      migratedPosts: migratedCount,
      logs,
    });
  } catch (error) {
    logError("Setup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Setup failed. Check server logs for details.",
      },
      { status: 500 },
    );
  }
}
