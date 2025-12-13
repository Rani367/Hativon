import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/middleware";
import { logError } from "@/lib/logger";

// Don't cache this route - it's user-specific
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        {
          headers: {
            // Allow browser to cache for 5 seconds to reduce repeated calls
            "Cache-Control": "private, max-age=5",
          },
        },
      );
    }

    return NextResponse.json(
      { authenticated: true, user },
      {
        headers: {
          // Cache authenticated sessions briefly on client
          "Cache-Control": "private, max-age=30",
        },
      },
    );
  } catch (error) {
    logError("Session check error:", error);
    return NextResponse.json({ authenticated: false });
  }
}
