import { cookies } from 'next/headers';
import { User } from '@/types/user.types';
import { verifyToken } from './jwt';
import { getUserById } from '../users';
import { isDatabaseAvailable } from '../db/client';

/**
 * Get current user from auth token
 * Returns null if not authenticated or token is invalid
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken');

    if (!authToken?.value) {
      return null;
    }

    const payload = verifyToken(authToken.value);

    if (!payload) {
      return null;
    }

    // Check if this is the legacy admin user
    if (payload.userId === 'legacy-admin') {
      // Return mock admin user for legacy mode
      return {
        id: 'legacy-admin',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin',
        email: undefined,
        grade: 'ז',
        classNumber: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: undefined,
      };
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return null;
    }

    // Fetch fresh user data from database
    const user = await getUserById(payload.userId);

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication for route
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require admin role for route
 * Throws error if not authenticated or not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Legacy admin authentication check (for backward compatibility)
 * Checks both old admin password cookie and new JWT system
 */
export async function isLegacyAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();

    // Check new JWT system
    const user = await getCurrentUser();
    if (user?.role === 'admin') {
      return true;
    }

    // Check old admin password system (for backward compatibility during migration)
    const legacyAuthToken = cookieStore.get('authToken');
    if (legacyAuthToken?.value === 'authenticated') {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}
