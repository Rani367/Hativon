import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminAuth } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";
import { createRateLimiter, getClientIdentifier } from "@/lib/rate-limit";

// Rate limiter: 5 attempts per 15 minutes
const adminPasswordRateLimiter = createRateLimiter({
  limit: 5,
  window: 15 * 60 * 1000, // 15 minutes
});

/**
 * POST /api/admin/verify-password - Verify admin password
 * No user authentication required - admin panel is accessible to anyone with the password
 * Rate limited: 5 attempts per 15 minutes
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await adminPasswordRateLimiter.check(
      `admin-verify:${identifier}`,
    );

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      return NextResponse.json(
        {
          error: "Too many attempts. Try again later.",
          resetAt: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
            ),
          },
        },
      );
    }

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
