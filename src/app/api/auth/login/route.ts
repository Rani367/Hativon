import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { validatePassword, updateLastLogin } from "@/lib/users";
import { createAuthCookie } from "@/lib/auth/jwt";
import { getAdminClearCookie } from "@/lib/auth/admin";
import { isDatabaseAvailable } from "@/lib/db/client";
import { logError } from "@/lib/logger";
import { userLoginSchema } from "@/lib/validation/schemas";
import { checkRateLimit, loginRateLimiter } from "@/lib/rate-limit";

/**
 * Constant-time string comparison to prevent timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  const bufA = Buffer.alloc(maxLen);
  const bufB = Buffer.alloc(maxLen);
  bufA.write(a);
  bufB.write(b);
  return timingSafeEqual(bufA, bufB) && a.length === b.length;
}

export async function POST(request: NextRequest) {
  // Rate limiting: 5 login attempts per 15 minutes
  const rateLimitResult = await checkRateLimit(
    request,
    loginRateLimiter,
    "login",
  );
  if (rateLimitResult.limited) {
    return rateLimitResult.response!;
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
  const validation = userLoginSchema.safeParse(body);

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
    const { username, password } = validation.data;

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      // Fallback to legacy admin password authentication
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        return NextResponse.json(
          { success: false, message: "מערכת האימות לא מוגדרת כראוי" },
          { status: 503 },
        );
      }

      // Check if credentials match admin password using constant-time comparison
      if (username === "admin" && safeCompare(password, adminPassword)) {
        // Create a mock admin user for legacy mode
        const legacyAdminUser = {
          id: "legacy-admin",
          username: "admin",
          displayName: "Admin",
          email: undefined,
          grade: "ז" as const,
          classNumber: 1,
          isTeacher: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: undefined,
        };

        // Generate auth cookie and clear admin cookie
        const authCookie = createAuthCookie(legacyAdminUser);
        const clearAdminCookie = getAdminClearCookie();

        const headers = new Headers();
        headers.append("Set-Cookie", authCookie);
        headers.append("Set-Cookie", clearAdminCookie);

        return NextResponse.json(
          { success: true, user: legacyAdminUser },
          {
            status: 200,
            headers,
          },
        );
      } else {
        return NextResponse.json(
          { success: false, message: "שם משתמש או סיסמה שגויים" },
          { status: 401 },
        );
      }
    }

    // Database is available - use normal authentication
    const user = await validatePassword(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "שם משתמש או סיסמה שגויים" },
        { status: 401 },
      );
    }

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Generate auth cookie and clear admin cookie
    // CRITICAL: Clear admin authentication when user logs in to prevent
    // privilege escalation (user shouldn't see all posts if they previously
    // accessed admin panel)
    const authCookie = createAuthCookie(user);
    const clearAdminCookie = getAdminClearCookie();

    const headers = new Headers();
    headers.append("Set-Cookie", authCookie);
    headers.append("Set-Cookie", clearAdminCookie);

    // Return success with user data
    return NextResponse.json(
      { success: true, user },
      {
        status: 200,
        headers,
      },
    );
  } catch (error) {
    logError("Login error:", error);
    return NextResponse.json(
      { success: false, message: "שגיאה בהתחברות. אנא נסה שנית." },
      { status: 500 },
    );
  }
}
