import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { cache } from "react";
import { getUserById } from "@/lib/users/queries";
import type { User } from "@/lib/users/types";

// Same cookie, secret and claims as the old app, so nobody is signed out when
// the rebuild goes live, and tokens still work if it has to be rolled back.
const COOKIE_NAME = "authToken";
const SESSION_SECONDS = Number(process.env.SESSION_DURATION) || 60 * 60 * 24 * 7;

interface SessionClaims {
  userId: string;
  username: string;
  /** Tokens from before session_version existed have none and count as 0. */
  sv?: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signSession(user: User): string {
  const claims: SessionClaims = {
    userId: user.id,
    username: user.username,
    sv: user.sessionVersion,
  };
  return jwt.sign(claims, getSecret(), { expiresIn: SESSION_SECONDS });
}

export function readSession(token: string): SessionClaims | null {
  try {
    return jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
    }) as SessionClaims;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: User): Promise<void> {
  (await cookies()).set(COOKIE_NAME, signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax so that opening a link from WhatsApp keeps the writer signed in.
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * The signed-in user, checked against the database on every request, so deleted
 * users, changed roles and password resets all take effect immediately.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = readSession(token);
  if (!claims) return null;

  const user = await getUserById(claims.userId);
  return user && user.sessionVersion === (claims.sv ?? 0) ? user : null;
});
