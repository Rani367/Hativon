import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getPostById,
  updatePost,
  deletePost,
  canUserEditPost,
  canUserDeletePost,
} from "@/lib/posts";
import { logError } from "@/lib/logger";
import { postUpdateSchema } from "@/lib/validation/schemas";
import type { PostInput } from "@/types/post.types";

/**
 * Shared handler for GET /api/.../posts/[id]
 * Works for both admin and user routes
 */
export async function handleGetPost(
  id: string,
  userId: string | undefined,
  isAdmin: boolean,
): Promise<NextResponse> {
  try {
    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user can view this post (own post or admin)
    const isOwner = userId && post.authorId === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(post);
  } catch (error) {
    logError("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}

/**
 * Shared handler for PATCH /api/.../posts/[id]
 * Works for both admin and user routes
 */
export async function handleUpdatePost(
  id: string,
  body: unknown,
  userId: string | undefined,
  isAdmin: boolean,
): Promise<NextResponse> {
  try {
    // Fetch post once and reuse for permission check to avoid N+1 query
    const existingPost = await getPostById(id);

    // Check if user can edit this post (pass existing post to avoid refetch)
    const canEdit = await canUserEditPost(
      userId || "legacy-admin",
      id,
      isAdmin,
      existingPost,
    );

    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own posts" },
        { status: 403 },
      );
    }

    // Validate request body with Zod
    const validation = postUpdateSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });

      return NextResponse.json(
        {
          error: "Invalid post data",
          errors,
        },
        { status: 400 },
      );
    }

    const updatedPost = await updatePost(id, validation.data);

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Granular cache invalidation - only revalidate posts tag and specific post path
    revalidateTag("posts", "max");

    return NextResponse.json(updatedPost);
  } catch (error) {
    logError("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}

/**
 * Shared handler for DELETE /api/.../posts/[id]
 * Works for both admin and user routes
 */
export async function handleDeletePost(
  id: string,
  userId: string | undefined,
  isAdmin: boolean,
): Promise<NextResponse> {
  try {
    // Fetch post once and reuse for permission check to avoid N+1 query
    const existingPost = await getPostById(id);

    // Check if user can delete this post (pass existing post to avoid refetch)
    const canDelete = await canUserDeletePost(
      userId || "legacy-admin",
      id,
      isAdmin,
      existingPost,
    );

    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own posts" },
        { status: 403 },
      );
    }

    const success = await deletePost(id);

    if (!success) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Granular cache invalidation - only revalidate posts tag
    revalidateTag("posts", "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}

/**
 * Standard API error response type
 */
export interface ApiErrorResponse {
  error: string;
  errors?: Record<string, string>;
}

/**
 * Standard API success response type
 */
export interface ApiSuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
