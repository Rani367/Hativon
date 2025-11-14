import type { User, UserRegistration, UserUpdate } from '@/types/user.types';
import type { UserQueryResult, DbMutationResult } from '@/types/database.types';
import { db } from '../db/client';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../constants/auth';

/**
 * Create a new user account
 * Automatically hashes password before storage
 *
 * @param data - User registration data
 * @returns Created User object (without password hash)
 * @throws Error with Hebrew message if username/email already exists
 */
export async function createUser(data: UserRegistration): Promise<User> {
  const { username, password, displayName, grade, classNumber } = data;

  // Hash password securely
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    const result = await db.query`
      INSERT INTO users (username, password_hash, display_name, email, grade, class_number)
      VALUES (${username}, ${passwordHash}, ${displayName}, null, ${grade}, ${classNumber})
      RETURNING
        id,
        username,
        display_name as "displayName",
        email,
        grade,
        class_number as "classNumber",
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_login as "lastLogin"
    ` as UserQueryResult;

    return result.rows[0] as User;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle duplicate key violations with user-friendly Hebrew messages
    if (errorMessage.includes('duplicate key')) {
      if (errorMessage.includes('username')) {
        throw new Error('שם המשתמש כבר קיים במערכת');
      }
      if (errorMessage.includes('email')) {
        throw new Error('כתובת האימייל כבר קיימת במערכת');
      }
    }

    throw error;
  }
}

/**
 * Update user information
 * Only updates provided fields (uses COALESCE for partial updates)
 *
 * @param userId - User UUID
 * @param updates - Partial user data to update
 * @returns Updated User object
 * @throws Error with Hebrew message if user not found
 */
export async function updateUser(userId: string, updates: UserUpdate): Promise<User> {
  const { displayName, email, grade, classNumber } = updates;

  const result = await db.query`
    UPDATE users
    SET
      display_name = COALESCE(${displayName}, display_name),
      email = COALESCE(${email}, email),
      grade = COALESCE(${grade}, grade),
      class_number = COALESCE(${classNumber}, class_number),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
    RETURNING
      id,
      username,
      display_name as "displayName",
      email,
      grade,
      class_number as "classNumber",
      created_at as "createdAt",
      updated_at as "updatedAt",
      last_login as "lastLogin"
  ` as UserQueryResult;

  if (result.rows.length === 0) {
    throw new Error('משתמש לא נמצא');
  }

  return result.rows[0] as User;
}

/**
 * Update user's last login timestamp to current time
 * Called after successful authentication
 *
 * @param userId - User UUID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await db.query`
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  ` as unknown as DbMutationResult;
}

/**
 * Delete a user account permanently
 * This will cascade delete all user-related data (posts, etc.)
 *
 * @param userId - User UUID
 */
export async function deleteUser(userId: string): Promise<void> {
  await db.query`
    DELETE FROM users
    WHERE id = ${userId}
  ` as unknown as DbMutationResult;
}
