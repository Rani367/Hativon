import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { clearAuthCookie } from "@/lib/auth/jwt";
import { getAdminClearCookie } from "@/lib/auth/admin";

export async function POST() {
  try {
    const headers = new Headers();
    headers.append("Set-Cookie", clearAuthCookie());
    headers.append("Set-Cookie", getAdminClearCookie());

    return NextResponse.json(
      { success: true, message: "התנתקת בהצלחה" },
      { status: 200, headers },
    );
  } catch (error) {
    logError("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "שגיאה בהתנתקות" },
      { status: 500 },
    );
  }
}
