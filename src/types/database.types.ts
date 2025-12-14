/**
 * Database Type Definitions
 *
 * Type-safe interfaces for PostgreSQL query results and database operations.
 * These types ensure proper typing throughout the database layer without using 'any'.
 */

import type { User } from "./user.types";
import type { Post } from "./post.types";

/**
 * Generic database query result structure
 * Matches the structure returned by @vercel/postgres and pg library
 */
export interface DbQueryResult<T> {
  rows: T[];
  rowCount: number;
  command: string;
  fields?: Array<{
    name: string;
    dataTypeID: number;
  }>;
}

/**
 * Database row representation of a user
 * Matches the structure returned by queries (with camelCase aliases)
 */
export interface DbUserRow {
  id: string;
  username: string;
  passwordHash?: string;
  displayName: string;
  email: string | null;
  grade: string;
  classNumber: number;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

/**
 * User row with password hash (for authentication queries)
 */
export interface DbUserWithPassword extends DbUserRow {
  passwordHash: string;
}

/**
 * Database row representation of a post
 * Matches the structure from the posts table
 * Note: PostgreSQL date columns are returned as Date objects
 */
export interface DbPostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  description: string;
  date: Date;
  author: string | null;
  author_id: string | null;
  author_grade: string | null;
  author_class: number | null;
  author_deleted?: boolean; // Computed field from LEFT JOIN with users table
  is_teacher_post?: boolean; // True if post was created by a teacher
  tags: string[] | null;
  category: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Database statistics result
 */
export interface DbStatsRow {
  total: string;
  published: string;
  drafts: string;
  today: string;
  this_week: string;
  this_month: string;
}

/**
 * Simple existence check result
 */
export interface DbExistsResult {
  exists: boolean;
}

/**
 * Delete/Update operation result (no rows returned)
 */
export type DbMutationResult = DbQueryResult<never>;

/**
 * Type helpers for common query patterns
 */
export type UserQueryResult = DbQueryResult<DbUserRow>;
export type PostQueryResult = DbQueryResult<DbPostRow>;
export type ExistsQueryResult = DbQueryResult<DbExistsResult>;
export type StatsQueryResult = DbQueryResult<DbStatsRow>;
