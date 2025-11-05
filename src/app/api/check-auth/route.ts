import { NextResponse } from 'next/server';
import { getCurrentUser, isLegacyAdminAuthenticated } from '@/lib/auth/middleware';

/**
 * Check authentication status
 * Supports both new JWT system and legacy admin authentication
 */
export async function GET() {
  try {
    // Try new JWT system first
    const user = await getCurrentUser();

    if (user) {
      return NextResponse.json({
        authenticated: true,
        user,
      });
    }

    // Fall back to legacy admin authentication
    const legacyAuth = await isLegacyAdminAuthenticated();

    return NextResponse.json({
      authenticated: legacyAuth,
      legacy: legacyAuth,
    });
  } catch (error) {
    console.error('Check auth error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
