import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, deleteUser } from "@/lib/users";
import { requireAdminAuth } from "@/lib/auth/admin";
import { isDatabaseAvailable } from "@/lib/db/client";
import { logError } from "@/lib/logger";
import { userUpdateSchema } from "@/lib/validation/schemas";
import { createErrorResponse } from "@/lib/api/response";

/**
 * GET /api/admin/users/[id] - Get single user (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAuth();

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 },
      );
    }

    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === "Admin authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logError("Error fetching user:", error);
    return createErrorResponse("Failed to fetch user", error, 500);
  }
}

/**
 * PATCH /api/admin/users/[id] - Update user (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAuth();

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 },
      );
    }

    const { id } = await params;
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
        { error: "Invalid user data", errors },
        { status: 400 },
      );
    }

    const updatedUser = await updateUser(id, validation.data);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === "Admin authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (errorMessage.includes("לא נמצא")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logError("Error updating user:", error);
    return createErrorResponse("Failed to update user", error, 500);
  }
}

/**
 * DELETE /api/admin/users/[id] - Delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAuth();

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 },
      );
    }

    const { id } = await params;

    // Get user to check if exists
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === "Admin authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logError("Error deleting user:", error);
    return createErrorResponse("Failed to delete user", error, 500);
  }
}
