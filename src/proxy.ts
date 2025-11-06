import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

/**
 * Authentication Proxy
 *
 * Protects admin and dashboard routes at the edge.
 * This runs before the request reaches the server, providing:
 * - Faster authentication checks
 * - Reduced server load
 * - Better security through early validation
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get JWT token from cookies
  const token = request.cookies.get('token')?.value;

  // Also check legacy admin cookie for backward compatibility
  const legacyAuth = request.cookies.get('admin_authenticated')?.value;

  // Protect admin routes (requires admin role)
  if (pathname.startsWith('/admin')) {
    // Allow access to login page
    if (pathname === '/admin' || pathname === '/admin/') {
      return NextResponse.next();
    }

    // Check legacy authentication first
    if (legacyAuth === 'true') {
      return NextResponse.next();
    }

    // Check JWT authentication
    if (!token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    try {
      const user = await verifyToken(token);

      if (!user || user.role !== 'admin') {
        // Clear invalid token
        const response = NextResponse.redirect(new URL('/admin', request.url));
        response.cookies.delete('token');
        return response;
      }

      // User is authenticated as admin
      return NextResponse.next();
    } catch (error) {
      // Token verification failed
      const response = NextResponse.redirect(new URL('/admin', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // Protect dashboard routes (requires any authenticated user)
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const user = await verifyToken(token);

      if (!user) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('token');
        return response;
      }

      // User is authenticated
      return NextResponse.next();
    } catch (error) {
      // Token verification failed
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which routes to run proxy on
export const config = {
  matcher: [
    // Admin routes (except login page)
    '/admin/dashboard/:path*',
    '/admin/posts/:path*',
    '/admin/users/:path*',
    // Dashboard routes
    '/dashboard/:path*',
  ],
};
