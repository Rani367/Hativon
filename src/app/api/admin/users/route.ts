import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/users';
import { requireAdmin } from '@/lib/auth/middleware';

/**
 * GET /api/admin/users - Get all users (admin only)
 */
export async function GET() {
  try {
    // Require admin authentication
    await requireAdmin();

    const users = await getAllUsers();

    return NextResponse.json({ users });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
