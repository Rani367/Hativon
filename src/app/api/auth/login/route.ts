import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, updateLastLogin } from '@/lib/users';
import { createAuthCookie } from '@/lib/auth/jwt';
import { UserLogin } from '@/types/user.types';
import { isDatabaseAvailable } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const body: UserLogin = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'שם משתמש וסיסמה הם שדות חובה' },
        { status: 400 }
      );
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      // Fallback to legacy admin password authentication
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        return NextResponse.json(
          { success: false, message: 'מערכת האימות לא מוגדרת כראוי' },
          { status: 503 }
        );
      }

      // Check if credentials match admin password
      if (username === 'admin' && password === adminPassword) {
        // Create a mock admin user for legacy mode
        const legacyAdminUser = {
          id: 'legacy-admin',
          username: 'admin',
          displayName: 'Admin',
          role: 'admin' as const,
          email: undefined,
          grade: 'ז' as const,
          classNumber: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: undefined,
        };

        // Generate auth cookie
        const cookie = createAuthCookie(legacyAdminUser);

        return NextResponse.json(
          { success: true, user: legacyAdminUser },
          {
            status: 200,
            headers: {
              'Set-Cookie': cookie,
            },
          }
        );
      } else {
        return NextResponse.json(
          { success: false, message: 'שם משתמש או סיסמה שגויים' },
          { status: 401 }
        );
      }
    }

    // Database is available - use normal authentication
    const user = await validatePassword(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'שם משתמש או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Generate auth cookie
    const cookie = createAuthCookie(user);

    // Return success with user data
    return NextResponse.json(
      { success: true, user },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie,
        },
      }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'שגיאה בהתחברות. אנא נסה שנית.' },
      { status: 500 }
    );
  }
}
