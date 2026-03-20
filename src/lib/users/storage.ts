import { randomBytes, createHash } from "crypto";
import type { User, UserRegistration, UserUpdate } from "@/types/user.types";
import type { UserQueryResult, DbMutationResult } from "@/types/database.types";
import { db } from "../db/client";
import { BCRYPT_SALT_ROUNDS, PASSWORD_RESET_TOKEN_EXPIRY_MS } from "../constants/auth";

export async function createUser(data: UserRegistration): Promise<User> {
  const { username, password, displayName, grade, classNumber, isTeacher } =
    data;

  const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: BCRYPT_SALT_ROUNDS });

  try {
    const result = (await db.query`
      INSERT INTO users (username, password_hash, display_name, email, grade, class_number, is_teacher)
      VALUES (${username}, ${passwordHash}, ${displayName}, null, ${grade || null}, ${classNumber || null}, ${isTeacher || false})
      RETURNING
        id,
        username,
        display_name as "displayName",
        email,
        grade,
        class_number as "classNumber",
        is_teacher as "isTeacher",
        password_reset_requested as "passwordResetRequested",
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_login as "lastLogin"
    `) as UserQueryResult;

    return result.rows[0] as User;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // friendly error messages for duplicate violations
    if (errorMessage.includes("duplicate key")) {
      if (errorMessage.includes("username")) {
        throw new Error("שם המשתמש כבר קיים במערכת");
      }
      if (errorMessage.includes("email")) {
        throw new Error("כתובת האימייל כבר קיימת במערכת");
      }
    }

    throw error;
  }
}

export async function updateUser(
  userId: string,
  updates: UserUpdate,
): Promise<User> {
  const { displayName, email, grade, classNumber } = updates;

  const result = (await db.query`
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
      is_teacher as "isTeacher",
      password_reset_requested as "passwordResetRequested",
      created_at as "createdAt",
      updated_at as "updatedAt",
      last_login as "lastLogin"
  `) as UserQueryResult;

  if (result.rows.length === 0) {
    throw new Error("משתמש לא נמצא");
  }

  return result.rows[0] as User;
}

export async function updateLastLogin(userId: string): Promise<void> {
  (await db.query`
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `) as unknown as DbMutationResult;
}

export async function deleteUser(userId: string): Promise<void> {
  (await db.query`
    DELETE FROM users
    WHERE id = ${userId}
  `) as unknown as DbMutationResult;
}

export async function setPasswordResetFlag(username: string): Promise<void> {
  (await db.query`
    UPDATE users
    SET password_reset_requested = TRUE
    WHERE username = ${username}
  `) as unknown as DbMutationResult;
}

export async function clearPasswordResetFlag(userId: string): Promise<void> {
  (await db.query`
    UPDATE users
    SET password_reset_requested = FALSE
    WHERE id = ${userId}
  `) as unknown as DbMutationResult;
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  const passwordHash = await Bun.password.hash(newPassword, { algorithm: "bcrypt", cost: BCRYPT_SALT_ROUNDS });

  (await db.query`
    UPDATE users
    SET
      password_hash = ${passwordHash},
      password_reset_requested = FALSE,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `) as unknown as DbMutationResult;
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

let tokensTableReady = false;

async function ensureTokensTable(): Promise<void> {
  if (tokensTableReady) return;
  await db.query`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await db.query`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
    ON password_reset_tokens(token_hash)
  `;
  await db.query`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
    ON password_reset_tokens(user_id)
  `;
  tokensTableReady = true;
}

export async function createResetToken(userId: string): Promise<string> {
  await ensureTokensTable();

  // Invalidate any existing tokens for this user
  (await db.query`
    DELETE FROM password_reset_tokens WHERE user_id = ${userId}
  `) as unknown as DbMutationResult;

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

  (await db.query`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `) as unknown as DbMutationResult;

  return rawToken;
}

export async function validateResetToken(rawToken: string): Promise<boolean> {
  await ensureTokensTable();
  const tokenHash = hashToken(rawToken);

  const result = (await db.query`
    SELECT EXISTS(
      SELECT 1 FROM password_reset_tokens
      WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    ) as "exists"
  `) as { rows: Array<{ exists: boolean }> };

  return result.rows[0]?.exists === true;
}

export async function consumeResetToken(rawToken: string): Promise<string | null> {
  await ensureTokensTable();
  const tokenHash = hashToken(rawToken);

  // Atomically delete the token and return the user_id
  const result = (await db.query`
    DELETE FROM password_reset_tokens
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    RETURNING user_id as "userId"
  `) as { rows: Array<{ userId: string }> };

  if (result.rows.length === 0) {
    return null;
  }

  const userId = result.rows[0].userId;

  // Clean up any remaining tokens for this user
  (await db.query`
    DELETE FROM password_reset_tokens WHERE user_id = ${userId}
  `) as unknown as DbMutationResult;

  return userId;
}
