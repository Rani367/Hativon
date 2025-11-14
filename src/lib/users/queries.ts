import type { User } from '@/types/user.types';
import type { UserQueryResult, ExistsQueryResult } from '@/types/database.types';
import { db } from '../db/client';

/**
 * SQL SELECT clause for user fields (excluding password_hash)
 * Used consistently across all user queries
 */
const USER_SELECT_FIELDS = `
  id,
  username,
  display_name as "displayName",
  email,
  grade,
  class_number as "classNumber",
  created_at as "createdAt",
  updated_at as "updatedAt",
  last_login as "lastLogin"
`;

/**
 * Get a user by their ID
 *
 * @param id - User UUID
 * @returns User object or null if not found
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await db.query`
    SELECT
      id,
      username,
      display_name as "displayName",
      email,
      grade,
      class_number as "classNumber",
      created_at as "createdAt",
      updated_at as "updatedAt",
      last_login as "lastLogin"
    FROM users
    WHERE id = ${id}
  ` as UserQueryResult;

  return (result.rows[0] as User) || null;
}

/**
 * Get a user by their username
 *
 * @param username - Unique username
 * @returns User object or null if not found
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await db.query`
    SELECT
      id,
      username,
      display_name as "displayName",
      email,
      grade,
      class_number as "classNumber",
      created_at as "createdAt",
      updated_at as "updatedAt",
      last_login as "lastLogin"
    FROM users
    WHERE username = ${username}
  ` as UserQueryResult;

  return (result.rows[0] as User) || null;
}

/**
 * Get user with password hash (internal use only for authentication)
 * DO NOT expose password hash in API responses
 *
 * @param username - Username to look up
 * @returns User object with passwordHash or null if not found
 * @internal
 */
export async function getUserWithPassword(
  username: string
): Promise<(User & { passwordHash: string }) | null> {
  const result = await db.query`
    SELECT
      id,
      username,
      password_hash as "passwordHash",
      display_name as "displayName",
      email,
      grade,
      class_number as "classNumber",
      created_at as "createdAt",
      updated_at as "updatedAt",
      last_login as "lastLogin"
    FROM users
    WHERE username = ${username}
  ` as UserQueryResult;

  return (result.rows[0] as (User & { passwordHash: string })) || null;
}

/**
 * Get all users (admin only)
 * Returns users sorted by creation date (newest first)
 *
 * @returns Array of all users
 */
export async function getAllUsers(): Promise<User[]> {
  const result = await db.query`
    SELECT
      id,
      username,
      display_name as "displayName",
      email,
      grade,
      class_number as "classNumber",
      created_at as "createdAt",
      updated_at as "updatedAt",
      last_login as "lastLogin"
    FROM users
    ORDER BY created_at DESC
  ` as UserQueryResult;

  return result.rows as User[];
}

/**
 * Check if a username is already taken
 *
 * @param username - Username to check
 * @returns true if username exists
 */
export async function usernameExists(username: string): Promise<boolean> {
  const result = await db.query`
    SELECT EXISTS(SELECT 1 FROM users WHERE username = ${username}) as exists
  ` as ExistsQueryResult;

  return result.rows[0].exists;
}
