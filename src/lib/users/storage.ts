import type { User, UserRegistration, UserUpdate } from "@/types/user.types";
import type { UserQueryResult, DbMutationResult } from "@/types/database.types";
import { db } from "../db/client";
import bcrypt from "bcrypt";
import { BCRYPT_SALT_ROUNDS } from "../constants/auth";

export async function createUser(data: UserRegistration): Promise<User> {
  const { username, password, displayName, grade, classNumber, isTeacher } =
    data;

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

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
