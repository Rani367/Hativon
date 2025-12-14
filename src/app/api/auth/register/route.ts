import { NextRequest, NextResponse } from "next/server";
import { createUser, usernameExists } from "@/lib/users";
import { createAuthCookie } from "@/lib/auth/jwt";
import { getAdminClearCookie, verifyAdminPassword } from "@/lib/auth/admin";
import { isDatabaseAvailable } from "@/lib/db/client";
import { logError } from "@/lib/logger";
import { userRegistrationSchema } from "@/lib/validation/schemas";
import { checkRateLimit, registerRateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting: 3 registration attempts per hour
  const rateLimitResult = await checkRateLimit(
    request,
    registerRateLimiter,
    "register",
  );
  if (rateLimitResult.limited) {
    return rateLimitResult.response!;
  }

  // Check if database is available
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      {
        success: false,
        message:
          'ההרשמה אינה זמינה במצב מקומי. אנא התחבר עם שם משתמש "admin" והסיסמה שהוגדרה.',
      },
      { status: 503 },
    );
  }

  // Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON",
      },
      { status: 400 },
    );
  }

  // Validate request body with Zod
  const validation = userRegistrationSchema.safeParse(body);

  if (!validation.success) {
    const errors: Record<string, string> = {};
    const errorMessages: string[] = [];

    // Zod validation errors - use 'issues' property
    validation.error.issues.forEach((err) => {
      const path = err.path?.join?.(".") || "unknown";
      const message = err.message || "Invalid value";
      errors[path] = message;
      errorMessages.push(message);
    });

    return NextResponse.json(
      {
        success: false,
        message:
          errorMessages.length > 0
            ? errorMessages.join(", ")
            : "נתונים לא תקינים",
        errors,
      },
      { status: 400 },
    );
  }

  try {
    const {
      username,
      password,
      displayName,
      grade,
      classNumber,
      isTeacher,
      adminPassword,
    } = validation.data;

    // If teacher registration, verify admin password
    if (isTeacher) {
      if (!adminPassword) {
        return NextResponse.json(
          { success: false, message: "סיסמת מנהל נדרשת למורים" },
          { status: 400 },
        );
      }

      const adminPasswordValid = await verifyAdminPassword(adminPassword);
      if (!adminPasswordValid) {
        return NextResponse.json(
          { success: false, message: "סיסמת מנהל שגויה" },
          { status: 401 },
        );
      }
    }

    // Check if username already exists
    const exists = await usernameExists(username);
    if (exists) {
      return NextResponse.json(
        { success: false, message: "שם המשתמש כבר קיים במערכת" },
        { status: 409 },
      );
    }

    // Create user (teachers don't need grade/class)
    const user = await createUser({
      username,
      password,
      displayName,
      grade: isTeacher ? undefined : grade,
      classNumber: isTeacher ? undefined : classNumber,
      isTeacher: isTeacher || false,
    });

    // Generate auth cookie and clear admin cookie
    // Clear admin authentication when user registers to prevent privilege escalation
    const authCookie = createAuthCookie(user);
    const clearAdminCookie = getAdminClearCookie();

    const headers = new Headers();
    headers.append("Set-Cookie", authCookie);
    headers.append("Set-Cookie", clearAdminCookie);

    // Return success with user data
    return NextResponse.json(
      { success: true, user },
      {
        status: 201,
        headers,
      },
    );
  } catch (error) {
    logError("Registration error:", error);

    // Handle specific errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("כבר קיים")) {
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "שגיאה ביצירת המשתמש. אנא נסה שנית." },
      { status: 500 },
    );
  }
}
