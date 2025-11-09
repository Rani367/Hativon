import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { updateUser } from '@/lib/users';
import { UserUpdate } from '@/types/user.types';

/**
 * PATCH /api/user/profile - Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body: UserUpdate = await request.json();

    // Validate grade and classNumber if provided
    if (body.grade && !['ז', 'ח', 'ט', 'י'].includes(body.grade)) {
      return NextResponse.json(
        { error: 'כיתה לא תקינה' },
        { status: 400 }
      );
    }

    if (body.classNumber && (body.classNumber < 1 || body.classNumber > 4)) {
      return NextResponse.json(
        { error: 'מספר כיתה חייב להיות בין 1 ל-4' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(user.id, body);

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.message?.includes('לא נמצא')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: `Failed to update profile: ${error.message}` },
      { status: 500 }
    );
  }
}
