import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/middleware";
import { isAdminAuthenticated, setAdminAuth } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

/**
 * Check authentication status
 * Only reveals admin status when user is authenticated to prevent information leakage
 * Auto-sets admin auth for teachers to avoid extra round-trip
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Only check and return admin status for authenticated users
      let adminAuth = await isAdminAuthenticated();

      // Auto-set admin auth for teachers if not already set
      // This avoids the extra round-trip to /api/admin/teacher-auth
      if (user.isTeacher && !adminAuth) {
        await setAdminAuth();
        adminAuth = true;
      }

      return NextResponse.json({
        authenticated: true,
        user,
        isAdmin: adminAuth,
        isTeacher: user.isTeacher || false,
      });
    }

    // For unauthenticated requests, only return authentication status
    // Do not reveal whether admin session exists to prevent information leakage
    return NextResponse.json({
      authenticated: false,
    });
  } catch (error) {
    logError("Check auth error:", error);
    return NextResponse.json({ authenticated: false });
  }
}
