import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const ADMIN_COOKIE_NAME = 'adminAuth';

/**
 * Admin authentication payload
 */
interface AdminAuthPayload {
  authenticated: boolean;
  timestamp: number;
}

/**
 * Verify admin password
 */
export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return false;
  }
  return password === ADMIN_PASSWORD;
}

/**
 * Create admin authentication token
 */
function createAdminToken(): string {
  const payload: AdminAuthPayload = {
    authenticated: true,
    timestamp: Date.now(),
  };

  // No expiry on token - session lasts until browser closes (session cookie)
  const token = jwt.sign(payload, JWT_SECRET);

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
 * Set admin authentication cookie (session-based - expires when browser closes)
 */
export async function setAdminAuth(): Promise<void> {
  const token = createAdminToken();
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // No maxAge - makes this a session cookie that expires when browser closes
    path: '/',
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
    console.error('Error checking admin authentication:', error);
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
    throw new Error('Admin authentication required');
  }
}
