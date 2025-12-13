import { cookies } from "next/headers";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { timingSafeEqual } from "crypto";

// Require ADMIN_PASSWORD to be set - no fallback for security
function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD environment variable must be set for admin panel access.",
    );
  }
  return password;
}

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

const ADMIN_PASSWORD = getAdminPassword();
const JWT_SECRET = getJwtSecret();
const ADMIN_COOKIE_NAME = "adminAuth";
const ADMIN_TOKEN_EXPIRY = "4h"; // 4 hours
const ADMIN_COOKIE_MAX_AGE = 4 * 60 * 60; // 4 hours in seconds

/**
 * Admin authentication payload
 */
interface AdminAuthPayload {
  authenticated: boolean;
  timestamp: number;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  // Pad strings to same length to prevent length-based timing attacks
  const maxLen = Math.max(a.length, b.length);
  const bufA = Buffer.alloc(maxLen);
  const bufB = Buffer.alloc(maxLen);
  bufA.write(a);
  bufB.write(b);
  return timingSafeEqual(bufA, bufB) && a.length === b.length;
}

/**
 * Verify admin password
 * Uses bcrypt.compare() for hashed passwords (constant-time)
 * Uses timingSafeEqual for plain text passwords (backward compatibility)
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  // Check if stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  const isBcryptHash = /^\$2[aby]\$/.test(ADMIN_PASSWORD);

  if (isBcryptHash) {
    // Use bcrypt comparison for hashed passwords (constant-time)
    return await bcrypt.compare(password, ADMIN_PASSWORD);
  } else {
    // For plain text passwords (backward compatibility)
    // Use constant-time comparison to prevent timing attacks
    console.warn(
      "[SECURITY WARNING] Admin password is not hashed. Run: pnpm run hash-admin-password",
    );
    return safeCompare(password, ADMIN_PASSWORD);
  }
}

/**
 * Create admin authentication token
 */
function createAdminToken(): string {
  const payload: AdminAuthPayload = {
    authenticated: true,
    timestamp: Date.now(),
  };

  // Token expires after 4 hours for security
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ADMIN_TOKEN_EXPIRY,
  });

  return token;
}

/**
 * Verify admin authentication token
 */
function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminAuthPayload;
    return decoded.authenticated === true;
  } catch (error) {
    return false;
  }
}

/**
 * Set admin authentication cookie (expires after 4 hours)
 */
export async function setAdminAuth(): Promise<void> {
  const token = createAdminToken();
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear admin authentication cookie
 */
export async function clearAdminAuth(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Get serialized cookie string to clear admin authentication
 * Use this when setting cookies via NextResponse headers
 */
export function getAdminClearCookie(): string {
  return serialize(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Check if user has admin authentication
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME);

    if (!adminToken?.value) {
      return false;
    }

    return verifyAdminToken(adminToken.value);
  } catch (error) {
    console.error("Error checking admin authentication:", error);
    return false;
  }
}

/**
 * Require admin authentication
 * Throws error if not authenticated as admin
 */
export async function requireAdminAuth(): Promise<void> {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    throw new Error("Admin authentication required");
  }
}
