import { db } from './db/client';
import bcrypt from 'bcryptjs';
import { User, UserRegistration, UserUpdate } from '@/types/user.types';
import type { UserQueryResult, DbMutationResult, ExistsQueryResult } from '@/types/database.types';

const SALT_ROUNDS = 12;

/**
 * Create a new user
 */
export async function createUser(data: UserRegistration): Promise<User> {
  const { username, password, displayName, grade, classNumber } = data;

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

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
 * Get user by ID
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
 * Get user by username
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
 * Get user with password hash (for authentication)
 */
async function getUserWithPassword(username: string): Promise<(User & { passwordHash: string }) | null> {
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
 * Validate user credentials
 */
export async function validatePassword(username: string, password: string): Promise<User | null> {
  const user = await getUserWithPassword(username);

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  // Remove password hash from returned user object
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await db.query`
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  ` as unknown as DbMutationResult;
}

/**
 * Get all users (admin only)
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
 * Update user information
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
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  await db.query`DELETE FROM users WHERE id = ${userId}` as unknown as DbMutationResult;
}

/**
 * Check if username exists
 */
export async function usernameExists(username: string): Promise<boolean> {
  const result = await db.query`
    SELECT EXISTS(SELECT 1 FROM users WHERE username = ${username}) as exists
  ` as ExistsQueryResult;
  return result.rows[0].exists;
}

