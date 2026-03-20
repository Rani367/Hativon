import { NextRequest, NextResponse } from "next/server";
import { validateResetToken, consumeResetToken, resetUserPassword } from "@/lib/users";
import { isDatabaseAvailable } from "@/lib/db/client";
import { logError } from "@/lib/logger";
import { checkRateLimit, loginRateLimiter } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validation/schemas";
import { z } from "zod";

const GENERIC_INVALID_MESSAGE = "הקישור אינו תקין או שפג תוקפו";

const resetSubmitSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

/**
 * GET /api/auth/reset-password?token=...
 * Validates a reset token without consuming it.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ valid: false }, { status: 503 });
    }

    const valid = await validateResetToken(token);
    return NextResponse.json({ valid });
  } catch (error) {
    logError("Token validation issue:", error);
    return NextResponse.json({ valid: false });
  }
}

/**
 * POST /api/auth/reset-password
 * Consumes a reset token and sets the new password.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(
    request,
    loginRateLimiter,
    "reset-password",
  );
  if (rateLimitResult.limited) {
    return rateLimitResult.response!;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: GENERIC_INVALID_MESSAGE },
      { status: 400 },
    );
  }

  const validation = resetSubmitSchema.safeParse(body);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const isPasswordIssue = firstIssue?.path[0] === "password";
    return NextResponse.json(
      { error: isPasswordIssue ? firstIssue.message : GENERIC_INVALID_MESSAGE },
      { status: 400 },
    );
  }

  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 },
      );
    }

    const { token, password } = validation.data;
    const userId = await consumeResetToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: GENERIC_INVALID_MESSAGE },
        { status: 400 },
      );
    }

    await resetUserPassword(userId, password);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Password reset issue:", error);
    return NextResponse.json(
      { error: GENERIC_INVALID_MESSAGE },
      { status: 400 },
    );
  }
}
