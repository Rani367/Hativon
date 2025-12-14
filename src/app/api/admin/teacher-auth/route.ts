import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/middleware";
import { setAdminAuth } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

/**
 * POST /api/admin/teacher-auth - Set admin auth for authenticated teachers
 * This allows teachers to access admin API routes without entering the admin password
 */
export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!user.isTeacher) {
      return NextResponse.json(
        { error: "Teacher account required" },
        { status: 403 }
      );
    }

    // Set admin authentication cookie for the teacher
    await setAdminAuth();

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Error setting teacher admin auth:", error);
    return NextResponse.json(
      { error: "Failed to set admin auth" },
      { status: 500 }
    );
  }
}
