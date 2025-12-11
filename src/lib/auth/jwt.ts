import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { User, JWTPayload } from "@/types/user.types";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const SESSION_DURATION = parseInt(process.env.SESSION_DURATION || "604800"); // 7 days default

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("WARNING: JWT_SECRET not set in production environment!");
}

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
