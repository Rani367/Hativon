import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Clear auth cookie using Next.js cookies API
    const cookieStore = await cookies();
    cookieStore.delete("authToken");

    return NextResponse.json(
      { success: true, message: "התנתקת בהצלחה" },
      { status: 200 },
    );
  } catch (error) {
    logError("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "שגיאה בהתנתקות" },
      { status: 500 },
    );
  }
}
