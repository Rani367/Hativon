import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    logError('Session check error:', error);
    return NextResponse.json({
      authenticated: false,
    });
  }
}
