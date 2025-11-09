import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/users';
import { requireAdminAuth } from '@/lib/auth/admin';
import { isDatabaseAvailable } from '@/lib/db/client';

/**
 * GET /api/admin/users - Get all users (admin only)
 */
export async function GET() {
  try {
    // Require admin authentication
    await requireAdminAuth();

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: 'Database not configured. User management requires PostgreSQL.' },
        { status: 503 }
      );
    }

    const users = await getAllUsers();

    return NextResponse.json({ users });
  } catch (error: any) {
    if (error.message === 'Admin authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.message?.includes('Database connection not configured')) {
      return NextResponse.json(
        { error: 'Database not configured. Set POSTGRES_URL in environment variables.' },
        { status: 503 }
      );
    }

    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: `Failed to fetch users: ${error.message}` },
      { status: 500 }
    );
  }
}
