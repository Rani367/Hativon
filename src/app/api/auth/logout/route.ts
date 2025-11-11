import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/jwt';
import { logError } from '@/lib/logger';

export async function POST() {
  try {
    // Clear auth cookie
    const cookie = clearAuthCookie();

    return NextResponse.json(
      { success: true, message: 'התנתקת בהצלחה' },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie,
        },
      }
    );
  } catch (error) {
    logError('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'שגיאה בהתנתקות' },
      { status: 500 }
    );
  }
}
