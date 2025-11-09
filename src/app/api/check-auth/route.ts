import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { isAdminAuthenticated } from '@/lib/auth/admin';

/**
 * Check authentication status
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const adminAuth = await isAdminAuthenticated();

    if (user) {
      return NextResponse.json({
        authenticated: true,
        user,
        isAdmin: adminAuth,
      });
    }

    // Even without user login, check if admin password was entered
    return NextResponse.json({
      authenticated: false,
      isAdmin: adminAuth,
    });
  } catch (error) {
    console.error('Check auth error:', error);
    return NextResponse.json({ authenticated: false, isAdmin: false });
  }
}
