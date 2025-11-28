import type { Post, PostStats } from "@/types/post.types";
import type { PostQueryResult, StatsQueryResult } from "@/types/database.types";
import { db } from "../db/client";
import { rowToPost } from "./utils";
import { memoize } from "../cache";

/**
 * Pagination options for querying posts
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Paginated result for posts query
 */
export interface PaginatedPosts {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Get all posts, optionally filtered by publication status
 *
 * @param filterPublished - If true, only return published posts
 * @param pagination - Optional pagination parameters (limit, offset)
 * @returns Array of posts sorted by date (newest first) or paginated result
 */
export async function getPosts(
  filterPublished = false,
  pagination?: PaginationOptions,
): Promise<Post[] | PaginatedPosts> {
  try {
    // If pagination is requested, return paginated result
    if (pagination) {
      const limit = pagination.limit || 10;
      const offset = pagination.offset || 0;

      // Get total count
      const countResult = filterPublished
        ? await db.query`
            SELECT COUNT(*) as count FROM posts WHERE status = 'published'
          `
        : await db.query`
            SELECT COUNT(*) as count FROM posts
          `;

      const total = parseInt((countResult.rows[0] as { count: string }).count);

      // Get paginated posts
      const result = filterPublished
        ? ((await db.query([
            `SELECT
              p.*,
              CASE WHEN u.id IS NULL AND p.author_id IS NOT NULL AND p.author_id != 'legacy-admin' THEN true ELSE false END as author_deleted
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id::text
            WHERE p.status = 'published'
            ORDER BY p.date DESC, p.created_at DESC
            LIMIT $1 OFFSET $2`,
            limit,
            offset,
          ])) as PostQueryResult)
        : ((await db.query([
            `SELECT
              p.*,
              CASE WHEN u.id IS NULL AND p.author_id IS NOT NULL AND p.author_id != 'legacy-admin' THEN true ELSE false END as author_deleted
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id::text
            ORDER BY p.date DESC, p.created_at DESC
            LIMIT $1 OFFSET $2`,
            limit,
            offset,
          ])) as PostQueryResult);

      const posts = result.rows.map(rowToPost);

      return {
        posts,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    }

    // Non-paginated (backward compatible)
    const result = filterPublished
      ? ((await db.query`
          SELECT
            p.*,
            CASE WHEN u.id IS NULL AND p.author_id IS NOT NULL AND p.author_id != 'legacy-admin' THEN true ELSE false END as author_deleted
          FROM posts p
          LEFT JOIN users u ON p.author_id = u.id::text
          WHERE p.status = 'published'
          ORDER BY p.date DESC, p.created_at DESC
        `) as PostQueryResult)
      : ((await db.query`
          SELECT
            p.*,
            CASE WHEN u.id IS NULL AND p.author_id IS NOT NULL AND p.author_id != 'legacy-admin' THEN true ELSE false END as author_deleted
          FROM posts p
          LEFT JOIN users u ON p.author_id = u.id::text
          ORDER BY p.date DESC, p.created_at DESC
        `) as PostQueryResult);

    return result.rows.map(rowToPost);
  } catch (error) {
    // Suppress error if posts table doesn't exist (common in fresh installs)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('relation "posts" does not exist')) {
      console.error("[ERROR] Failed to fetch posts:", error);
    }
    return pagination
      ? {
          posts: [],
          total: 0,
          limit: pagination.limit || 10,
          offset: pagination.offset || 0,
          hasMore: false,
        }
      : [];
  }
}

/**
 * Get a single post by its ID
 *
 * @param id - Post UUID
 * @returns Post object or null if not found
 */
export async function getPostById(id: string): Promise<Post | null> {
  try {
    const result = (await db.query`
      SELECT
        p.*,
        CASE WHEN u.id IS NULL AND p.author_id IS NOT NULL AND p.author_id != 'legacy-admin' THEN true ELSE false END as author_deleted
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id::text
      WHERE p.id = ${id}
    `) as PostQueryResult;

    if (result.rows.length === 0) {
      return null;
    }

    return rowToPost(result.rows[0]);
  } catch (error) {
    // Suppress error if posts table doesn't exist (common in fresh installs)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('relation "posts" does not exist')) {
      console.error("[ERROR] Failed to fetch post by ID:", error);
    }
    return null;
  }
}

/**
 * Get a single published post by its slug
 * Only returns published posts for security
 *
 * @param slug - URL-friendly post identifier
 * @returns Post object or null if not found or not published
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const result = (await db.query`
      SELECT
        p.*,
        CASE WHEN u.id IS NULL AND p.author_id IS NOT NULL AND p.author_id != 'legacy-admin' THEN true ELSE false END as author_deleted
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id::text
      WHERE p.slug = ${slug} AND p.status = 'published'
    `) as PostQueryResult;

    if (result.rows.length === 0) {
      return null;
    }

    return rowToPost(result.rows[0]);
  } catch (error) {
    // Suppress error if posts table doesn't exist (common in fresh installs)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('relation "posts" does not exist')) {
      console.error("[ERROR] Failed to fetch post by slug:", error);
    }
    return null;
  }
}

/**
 * Get all posts by a specific author
 *
 * @param authorId - User ID of the author
 * @returns Array of posts by the author, sorted by date (newest first)
 */
export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  try {
    const result = (await db.query`
      SELECT
        p.*,
        CASE WHEN u.id IS NULL AND p.author_id IS NOT NULL AND p.author_id != 'legacy-admin' THEN true ELSE false END as author_deleted
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id::text
      WHERE p.author_id = ${authorId}
      ORDER BY p.date DESC, p.created_at DESC
    `) as PostQueryResult;

    return result.rows.map(rowToPost);
  } catch (error) {
    // Suppress error if posts table doesn't exist (common in fresh installs)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('relation "posts" does not exist')) {
      console.error("[ERROR] Failed to fetch posts by author:", error);
    }
    return [];
  }
}

/**
 * Get aggregated post statistics
 * Includes total counts, status breakdown, and time-based metrics
 *
 * @returns PostStats object with various counts
 */
export async function getPostStats(): Promise<PostStats> {
  try {
    const result = (await db.query`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
        SUM(CASE WHEN created_at >= CURRENT_DATE THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as this_week,
        SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 ELSE 0 END) as this_month
      FROM posts
    `) as StatsQueryResult;

    const row = result.rows[0];
    return {
      total: parseInt(row.total) || 0,
      published: parseInt(row.published) || 0,
      drafts: parseInt(row.drafts) || 0,
      today: parseInt(row.today) || 0,
      thisWeek: parseInt(row.this_week) || 0,
      thisMonth: parseInt(row.this_month) || 0,
    };
  } catch (error) {
    // Suppress error if posts table doesn't exist (common in fresh installs)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('relation "posts" does not exist')) {
      console.error("[ERROR] Failed to fetch post stats:", error);
    }
    return {
      total: 0,
      published: 0,
      drafts: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };
  }
}
