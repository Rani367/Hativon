import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser } from '@/lib/users';
import { requireAdminAuth } from '@/lib/auth/admin';
import { UserUpdate } from '@/types/user.types';
import { isDatabaseAvailable } from '@/lib/db/client';

/**
 * GET /api/admin/users/[id] - Get single user (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.message === 'Admin authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: `Failed to fetch user: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id] - Update user (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body: UserUpdate = await request.json();

    const updatedUser = await updateUser(id, body);

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    if (error.message === 'Admin authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.message?.includes('לא נמצא')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: `Failed to update user: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id] - Delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;

    // Get user to check if exists
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Admin authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: `Failed to delete user: ${error.message}` },
      { status: 500 }
    );
  }
}
