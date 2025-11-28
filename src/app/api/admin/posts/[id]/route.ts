import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/middleware";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import {
  handleGetPost,
  handleUpdatePost,
  handleDeletePost,
} from "@/lib/api/handlers/posts";

// GET /api/admin/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication - Admin panel auth takes priority over user JWT auth
  const isAdmin = await isAdminAuthenticated();
  const user = await getCurrentUser();

  // Require either admin auth OR user auth
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  return handleGetPost(id, user?.id, isAdmin);
}

// PATCH /api/admin/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication - Admin panel auth takes priority over user JWT auth
  const isAdmin = await isAdminAuthenticated();
  const user = await getCurrentUser();

  // Require either admin auth OR user auth
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  return handleUpdatePost(id, body, user?.id, isAdmin);
}

// DELETE /api/admin/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication - Admin panel auth takes priority over user JWT auth
  const isAdmin = await isAdminAuthenticated();
  const user = await getCurrentUser();

  // Require either admin auth OR user auth
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  return handleDeletePost(id, user?.id, isAdmin);
}
