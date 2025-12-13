import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/middleware";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

/**
 * Check authentication status
 * Only reveals admin status when user is authenticated to prevent information leakage
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Only check and return admin status for authenticated users
      const adminAuth = await isAdminAuthenticated();
      return NextResponse.json({
        authenticated: true,
        user,
        isAdmin: adminAuth,
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
