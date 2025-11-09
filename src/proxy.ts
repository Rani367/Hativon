import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

/**
 * Verify JWT token using jose (Edge Runtime compatible)
 */
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Authentication Proxy
 *
 * Protects admin and dashboard routes at the edge.
 * This runs before the request reaches the server, providing:
 * - Faster authentication checks
 * - Reduced server load
 * - Better security through early validation
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get JWT token from cookies
  const token = request.cookies.get('authToken')?.value;

  // Protect dashboard routes (requires authenticated user)
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const user = await verifyToken(token);

      if (!user) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('authToken');
        return response;
      }

      // User is authenticated
      return NextResponse.next();
    } catch (error) {
      // Token verification failed
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('authToken');
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which routes to run proxy on
export const config = {
  matcher: [
    // Dashboard routes (require user authentication)
    '/dashboard',
    '/dashboard/:path*',
  ],
};
