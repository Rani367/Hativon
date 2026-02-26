import { NextRequest, NextResponse } from "next/server";
import { setPasswordResetFlag } from "@/lib/users";
import { isDatabaseAvailable } from "@/lib/db/client";
import { logError } from "@/lib/logger";
import { checkRateLimit, loginRateLimiter } from "@/lib/rate-limit";
import { z } from "zod";

const requestSchema = z.object({
  username: z.string().min(1, "שם משתמש נדרש"),
});

/**
 * POST /api/auth/request-password-reset
 * Public endpoint for users to request a password reset.
 * Always returns success to avoid revealing valid usernames.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(
    request,
    loginRateLimiter,
    "password-reset",
  );
  if (rateLimitResult.limited) {
    return rateLimitResult.response!;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 },
    );
  }

  const validation = requestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: "שם משתמש נדרש" },
      { status: 400 },
    );
  }

  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      // Return success anyway to not reveal system state
      return NextResponse.json({ success: true });
    }

    const { username } = validation.data;

    // Set the flag if user exists; silently do nothing if they don't
    await setPasswordResetFlag(username);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Password reset request handling issue:", error);
    // Still return success to avoid revealing information
    return NextResponse.json({ success: true });
  }
}
