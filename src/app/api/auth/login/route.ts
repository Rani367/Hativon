import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, updateLastLogin } from '@/lib/users';
import { createAuthCookie } from '@/lib/auth/jwt';
import { UserLogin } from '@/types/user.types';
import { isDatabaseAvailable } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, message: 'מערכת המשתמשים אינה זמינה כרגע. יש להגדיר את מסד הנתונים תחילה.' },
        { status: 503 }
      );
    }

    const body: UserLogin = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'שם משתמש וסיסמה הם שדות חובה' },
        { status: 400 }
      );
    }

    // Validate credentials
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
