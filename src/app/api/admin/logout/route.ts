import { NextResponse } from 'next/server';
import { clearAdminAuth, getAdminClearCookie } from '@/lib/auth/admin';
import { logError } from '@/lib/logger';

/**
 * Logout admin (clear admin password session)
 */
export async function POST() {
  try {
    await clearAdminAuth();

    const response = NextResponse.json(
      { success: true, message: 'התנתקת בהצלחה' },
      { status: 200 }
    );
    response.headers.append('Set-Cookie', getAdminClearCookie());
    return response;
  } catch (error) {
    logError('Admin logout error:', error);
    return NextResponse.json(
      { success: false, message: 'שגיאה בהתנתקות' },
      { status: 500 }
    );
  }
}
