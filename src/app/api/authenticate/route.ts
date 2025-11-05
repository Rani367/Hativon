import { NextRequest, NextResponse } from 'next/server';
import { createAuthCookie } from '@/lib/auth/jwt';
import { getUserByUsername, createAdminUser } from '@/lib/users';
import { isDatabaseAvailable } from '@/lib/db/client';

/**
 * Legacy admin authentication endpoint
 * Checks admin password and creates/returns JWT token
 * Creates admin user if it doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Validate admin password
    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Check if database is available for new JWT system
    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      // Fallback to legacy cookie authentication if database not available
      const authCookie = 'authToken=authenticated; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/';
      const response = NextResponse.json({ success: true, legacy: true });
      response.headers.set('Set-Cookie', authCookie);
      return response;
    }

    // Database is available - use new JWT system
    // Try to get or create admin user
    let adminUser = await getUserByUsername('admin');

    if (!adminUser) {
      // Create default admin user
      try {
        adminUser = await createAdminUser({
          username: 'admin',
          password: adminPassword,
          displayName: 'מנהל',
          email: undefined,
        });
      } catch (error: any) {
        console.error('Error creating admin user:', error);
        // Fallback to legacy auth if user creation fails
        const authCookie = 'authToken=authenticated; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/';
        const response = NextResponse.json({ success: true, legacy: true });
        response.headers.set('Set-Cookie', authCookie);
        return response;
      }
    }

    // Generate JWT auth cookie
    const authCookie = createAuthCookie(adminUser);

    const response = NextResponse.json({ success: true, user: adminUser });
    response.headers.set('Set-Cookie', authCookie);

    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
