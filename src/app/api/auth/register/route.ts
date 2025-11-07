import { NextRequest, NextResponse } from 'next/server';
import { createUser, usernameExists } from '@/lib/users';
import { createAuthCookie } from '@/lib/auth/jwt';
import { UserRegistration } from '@/types/user.types';
import { isDatabaseAvailable } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, message: 'ההרשמה אינה זמינה במצב מקומי. אנא התחבר עם שם משתמש "admin" והסיסמה שהוגדרה.' },
        { status: 503 }
      );
    }

    const body: UserRegistration = await request.json();
    const { username, password, displayName, grade, classNumber } = body;

    // Validation
    if (!username || !password || !displayName || !grade || !classNumber) {
      return NextResponse.json(
        { success: false, message: 'שם משתמש, סיסמה, שם מלא, כיתה ומספר כיתה הם שדות חובה' },
        { status: 400 }
      );
    }

    // Username validation (alphanumeric, 3-50 chars)
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return NextResponse.json(
        { success: false, message: 'שם המשתמש חייב להכיל 3-50 תווים (אותיות אנגליות, מספרים וקו תחתון בלבד)' },
        { status: 400 }
      );
    }

    // Password validation (min 8 chars)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'הסיסמה חייבת להכיל לפחות 8 תווים' },
        { status: 400 }
      );
    }

    // Grade validation
    const validGrades = ['ז', 'ח', 'ט', 'י'];
    if (!validGrades.includes(grade)) {
      return NextResponse.json(
        { success: false, message: 'כיתה לא תקינה' },
        { status: 400 }
      );
    }

    // Class number validation
    if (classNumber < 1 || classNumber > 4) {
      return NextResponse.json(
        { success: false, message: 'מספר כיתה חייב להיות בין 1 ל-4' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const exists = await usernameExists(username);
    if (exists) {
      return NextResponse.json(
        { success: false, message: 'שם המשתמש כבר קיים במערכת' },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser(body);

    // Generate auth cookie
    const cookie = createAuthCookie(user);

    // Return success with user data
    return NextResponse.json(
      { success: true, user },
      {
        status: 201,
        headers: {
          'Set-Cookie': cookie,
        },
      }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle specific errors
    if (error.message?.includes('כבר קיים')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'שגיאה ביצירת המשתמש. אנא נסה שנית.' },
      { status: 500 }
    );
  }
}
