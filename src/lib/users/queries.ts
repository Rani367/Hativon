import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { User } from "./types";

const RESET_TOKEN_HOURS = 1;

type Row = Record<string, unknown>;

function toUser(row: Row): User {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    grade: (row.grade as string | null) ?? null,
    classNumber: (row.class_number as number | null) ?? null,
    isTeacher: row.is_teacher === true,
    passwordResetRequested: row.password_reset_requested === true,
    aiImageSurveyDismissed: row.ai_image_survey_dismissed === true,
    sessionVersion: (row.session_version as number | null) ?? 0,
    createdAt: (row.created_at as Date).toISOString(),
    lastLogin: row.last_login ? (row.last_login as Date).toISOString() : null,
  };
}

/** Compares as text, so a malformed id finds nothing instead of raising an error. */
export async function getUserById(id: string): Promise<User | null> {
  const rows = await db()`SELECT * FROM users WHERE id::text = ${id}`;
  return rows[0] ? toUser(rows[0]) : null;
}

export async function getUserWithPassword(
  username: string,
): Promise<(User & { passwordHash: string }) | null> {
  const rows = await db()`SELECT * FROM users WHERE username = ${username}`;
  const row = rows[0];
  return row
    ? { ...toUser(row), passwordHash: row.password_hash as string }
    : null;
}

export async function createUser(input: {
  username: string;
  passwordHash: string;
  displayName: string;
  grade: string | null;
  classNumber: number | null;
}): Promise<User> {
  // grade and class have column defaults, so a teacher's must be written as NULL
  // or they'd be saved as a student in י1.
  const rows = await db()`
    INSERT INTO users (username, password_hash, display_name, email, grade, class_number)
    VALUES (
      ${input.username}, ${input.passwordHash}, ${input.displayName},
      NULL, ${input.grade}, ${input.classNumber}
    )
    RETURNING *
  `;
  return toUser(rows[0]);
}

export async function updateProfile(
  id: string,
  input: { displayName: string; grade: string | null; classNumber: number | null },
): Promise<void> {
  await db()`
    UPDATE users
    SET display_name = ${input.displayName},
        grade = ${input.grade},
        class_number = ${input.classNumber}
    WHERE id::text = ${id}
  `;
}

export async function touchLastLogin(id: string): Promise<void> {
  await db()`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id::text = ${id}`;
}

export async function listUsers(): Promise<User[]> {
  const rows = await db()`SELECT * FROM users ORDER BY created_at DESC`;
  return rows.map(toUser);
}

export async function countTeachers(): Promise<number> {
  const rows = await db()`SELECT COUNT(*)::int AS count FROM users WHERE is_teacher`;
  return rows[0].count as number;
}

export async function deleteUser(id: string): Promise<void> {
  await db()`DELETE FROM users WHERE id::text = ${id}`;
}

export async function setTeacher(id: string, isTeacher: boolean): Promise<void> {
  await db()`UPDATE users SET is_teacher = ${isTeacher} WHERE id::text = ${id}`;
}

export async function dismissAiSurvey(id: string): Promise<void> {
  await db()`
    UPDATE users SET ai_image_survey_dismissed = TRUE WHERE id::text = ${id}
  `;
}

export async function flagPasswordReset(username: string): Promise<void> {
  await db()`
    UPDATE users SET password_reset_requested = TRUE WHERE username = ${username}
  `;
}

export async function clearPasswordResetFlag(id: string): Promise<void> {
  await db()`
    UPDATE users SET password_reset_requested = FALSE WHERE id::text = ${id}
  `;
}

/** Sets a new password and signs the user out of every device. */
export async function setPassword(id: string, passwordHash: string): Promise<void> {
  await db()`
    UPDATE users
    SET password_hash = ${passwordHash},
        password_reset_requested = FALSE,
        session_version = session_version + 1
    WHERE id::text = ${id}
  `;
}

/** Only the hash is stored, so a database leak doesn't expose working links. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createResetToken(userId: string): Promise<string> {
  await db()`DELETE FROM password_reset_tokens WHERE user_id::text = ${userId}`;

  const token = randomBytes(32).toString("base64url");
  await db()`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (
      ${userId}::uuid, ${hashToken(token)},
      CURRENT_TIMESTAMP + make_interval(hours => ${RESET_TOKEN_HOURS})
    )
  `;
  return token;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const rows = await db()`
    SELECT 1 FROM password_reset_tokens
    WHERE token_hash = ${hashToken(token)} AND expires_at > CURRENT_TIMESTAMP
  `;
  return rows.length > 0;
}

/** Uses up a token, returning whose it was, or null if it's invalid or expired. */
export async function consumeResetToken(token: string): Promise<string | null> {
  const rows = await db()`
    DELETE FROM password_reset_tokens
    WHERE token_hash = ${hashToken(token)} AND expires_at > CURRENT_TIMESTAMP
    RETURNING user_id
  `;
  return rows[0] ? (rows[0].user_id as string) : null;
}
