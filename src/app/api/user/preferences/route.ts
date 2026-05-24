import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { updateUserPreferences } from "@/lib/users";
import { createErrorResponse } from "@/lib/api/response";
import { logError } from "@/lib/logger";
import { userPreferencesUpdateSchema } from "@/lib/validation/schemas";

/**
 * PATCH /api/user/preferences - Update current user's display preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validation = userPreferencesUpdateSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path || "preferences"] = err.message;
      });

      return NextResponse.json(
        { error: "Invalid preferences data", errors },
        { status: 400 },
      );
    }

    const updatedUser = await updateUserPreferences(user.id, validation.data);

    return NextResponse.json({
      preferences: {
        themePreference: updatedUser.themePreference,
      },
      user: updatedUser,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (errorMessage.includes("לא נמצא")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logError("Error updating user preferences:", error);
    return createErrorResponse("Failed to update preferences", error, 500);
  }
}
