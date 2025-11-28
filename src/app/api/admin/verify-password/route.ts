import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminAuth } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

/**
 * POST /api/admin/verify-password - Verify admin password
 * No user authentication required - admin panel is accessible to anyone with the password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    // Verify admin password (async due to bcrypt)
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid admin password" },
        { status: 401 },
      );
    }

    // Set admin authentication cookie
    await setAdminAuth();

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Error verifying admin password:", error);
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 },
    );
  }
}
