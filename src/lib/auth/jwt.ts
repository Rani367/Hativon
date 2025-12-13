import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { User, JWTPayload } from "@/types/user.types";

// Require JWT_SECRET to be set - no fallback for security
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable must be set. Generate one with: openssl rand -base64 32",
    );
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();
const SESSION_DURATION = parseInt(process.env.SESSION_DURATION || "172800"); // 2 days default

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: SESSION_DURATION,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function createAuthCookie(user: User): string {
  const token = generateToken(user);

  return serialize("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export function clearAuthCookie(): string {
  return serialize("authToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

export function extractTokenFromCookies(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return cookies["authToken"] || null;
}
