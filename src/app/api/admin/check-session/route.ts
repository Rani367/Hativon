import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

/**
 * GET /api/admin/check-session - Check if admin session cookie is valid
 *
 * This endpoint is specifically for admin panel authentication.
 * Unlike /api/check-auth, this returns admin status regardless of user login state.
 * This is safe because it only returns a boolean - no sensitive data is exposed.
 */
export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated();

    return NextResponse.json({
      authenticated: isAdmin,
    });
  } catch (error) {
    logError("Admin session check error:", error);
    return NextResponse.json({ authenticated: false });
  }
}
