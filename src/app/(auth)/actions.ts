"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import type { FormState } from "@/lib/form-state";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { SIGNUP_CODE_KEY, getSetting } from "@/lib/settings";
import { studioCopy } from "@/lib/studio-copy";
import {
  consumeResetToken,
  createUser,
  flagPasswordReset,
  getUserById,
  getUserWithPassword,
  setPassword,
  touchLastLogin,
} from "@/lib/users/queries";

const BCRYPT_COST = 12;
const { auth: text } = studioCopy;

const passwordSchema = z.string().min(8).max(128);
const grades = ["ז", "ח", "ט", "י"] as const;

// Deliberately loose: older usernames must keep working whatever today's rules are.
const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(128),
});

const signupSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]{3,50}$/),
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: z.string().trim().min(2).max(100),
  role: z.enum(["student", "teacher"]),
  grade: z.enum(grades).optional(),
  classNumber: z.coerce.number().int().min(1).max(4).optional(),
  classCode: z.string().trim().min(1),
});

function fields(form: FormData): Record<string, unknown> {
  // An unselected option arrives as "", which should mean missing.
  return Object.fromEntries(
    [...form.entries()].filter(([, value]) => value !== ""),
  );
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(fields(form));
  if (!parsed.success) return { error: text.wrongLogin };

  const { username, password } = parsed.data;
  const ip = await getClientIp();

  if (
    (await isRateLimited("login", `${username}:${ip}`)) ||
    (await isRateLimited("loginByIp", ip))
  ) {
    return { error: text.tooMany };
  }

  const user = await getUserWithPassword(username);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: text.wrongLogin };
  }

  await touchLastLogin(user.id);
  await setSessionCookie(user);
  redirect("/dashboard");
}

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const ip = await getClientIp();
  if (await isRateLimited("signup", ip)) return { error: text.tooMany };

  const parsed = signupSchema.safeParse(fields(form));
  if (!parsed.success) return { error: text.invalid };

  const input = parsed.data;
  if (input.password !== input.confirmPassword) {
    return { error: text.passwordMismatch };
  }

  const student = input.role === "student";
  if (student && (!input.grade || !input.classNumber)) {
    return { error: text.invalid };
  }

  const code = await getSetting(SIGNUP_CODE_KEY);
  if (!code) return { error: text.signupClosed };

  if (input.classCode !== code) {
    await isRateLimited("wrongClassCode", ip);
    return { error: text.wrongCode };
  }

  let user;
  try {
    user = await createUser({
      username: input.username,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_COST),
      displayName: input.displayName,
      // A teacher gets no grade, which marks them as waiting for approval. They
      // can write like anyone else, and only another teacher can promote them.
      grade: student ? input.grade! : null,
      classNumber: student ? input.classNumber! : null,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: text.usernameTaken };
    }
    throw error;
  }

  await setSessionCookie(user);
  redirect("/dashboard");
}

export async function requestPasswordReset(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  if (await isRateLimited("passwordReset", await getClientIp())) {
    return { error: text.tooMany };
  }

  const username = form.get("username");
  if (typeof username === "string" && username) {
    await flagPasswordReset(username);
  }

  // The same answer either way, so this can't reveal who has an account.
  return { success: text.requested };
}

export async function resetPassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  if (await isRateLimited("passwordReset", await getClientIp())) {
    return { error: text.tooMany };
  }

  const token = form.get("token");
  const password = passwordSchema.safeParse(form.get("password"));

  if (typeof token !== "string" || !password.success) {
    return { error: text.invalid };
  }
  if (password.data !== form.get("confirmPassword")) {
    return { error: text.passwordMismatch };
  }

  const userId = await consumeResetToken(token);
  if (!userId || !(await getUserById(userId))) return { error: text.badToken };

  await setPassword(userId, await bcrypt.hash(password.data, BCRYPT_COST));
  return { success: text.passwordChanged };
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
