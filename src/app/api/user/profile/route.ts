import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { updateUser } from "@/lib/users";
import { logError } from "@/lib/logger";
import { userUpdateSchema } from "@/lib/validation/schemas";
import { createErrorResponse } from "@/lib/api/response";

/**
 * PATCH /api/user/profile - Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate request body with Zod
    const validation = userUpdateSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });

      return NextResponse.json(
        { error: "Invalid profile data", errors },
        { status: 400 },
      );
    }

    const updatedUser = await updateUser(user.id, validation.data);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (errorMessage.includes("לא נמצא")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logError("Error updating profile:", error);
    return createErrorResponse("Failed to update profile", error, 500);
  }
}
