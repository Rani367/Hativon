import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createPost, updatePost, getPostById } from "@/lib/posts";
import { getCurrentUser } from "@/lib/auth/middleware";
import { logError } from "@/lib/logger";
import { autoSavePayloadSchema } from "@/lib/validation/autosave-schemas";

/**
 * POST /api/user/posts/autosave
 * Auto-save post content - creates new draft or updates existing post
 *
 * For new posts (postId is null): Creates a new draft post
 * For existing posts: Updates the post with conflict detection
 *
 * Returns 409 Conflict if server version differs from expectedVersion
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validation = autoSavePayloadSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });

      return NextResponse.json(
        { error: "Invalid auto-save data", errors },
        { status: 400 },
      );
    }

    const {
      postId,
      title,
      content,
      description,
      coverImage,
      customAuthor,
      expectedVersion,
    } = validation.data;

    // Handle new post creation
    if (!postId) {
      // Require at least title or content for new posts
      if (!title && !content) {
        return NextResponse.json(
          { error: "Title or content required for new post" },
          { status: 400 },
        );
      }

      const newPost = await createPost({
        title: title || "טיוטה ללא כותרת",
        content: content || "",
        description: description || undefined,
        coverImage: coverImage || undefined,
        author: customAuthor || user.displayName,
        authorId: user.id,
        authorGrade: user.isTeacher ? undefined : user.grade,
        authorClass: user.isTeacher ? undefined : user.classNumber,
        isTeacherPost: user.isTeacher,
        status: "draft",
      });

      revalidateTag("posts", "max");

      return NextResponse.json({
        success: true,
        id: newPost.id,
        updatedAt: newPost.updatedAt,
        isNew: true,
      });
    }

    // Handle existing post update
    const existingPost = await getPostById(postId);

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check ownership - user can only auto-save their own posts
    if (existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own posts" },
        { status: 403 },
      );
    }

    // Conflict detection - check if server version differs
    if (expectedVersion) {
      const serverTime = new Date(existingPost.updatedAt).getTime();
      const expectedTime = new Date(expectedVersion).getTime();

      if (serverTime > expectedTime) {
        // Server has newer version - return conflict response
        return NextResponse.json(
          {
            conflict: true,
            serverVersion: existingPost.updatedAt,
            serverContent: {
              title: existingPost.title,
              content: existingPost.content,
              description: existingPost.description,
              coverImage: existingPost.coverImage,
              customAuthor: existingPost.author,
            },
          },
          { status: 409 },
        );
      }
    }

    // Build update payload - only include fields that are provided
    const updatePayload: Record<string, string | undefined> = {};
    if (title !== undefined) updatePayload.title = title;
    if (content !== undefined) updatePayload.content = content;
    if (description !== undefined) updatePayload.description = description;
    if (coverImage !== undefined) updatePayload.coverImage = coverImage;
    if (customAuthor !== undefined) updatePayload.author = customAuthor;

    // Only update if there's something to update
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({
        success: true,
        id: postId,
        updatedAt: existingPost.updatedAt,
        isNew: false,
      });
    }

    const updatedPost = await updatePost(postId, updatePayload);

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    revalidateTag("posts", "max");

    return NextResponse.json({
      success: true,
      id: updatedPost.id,
      updatedAt: updatedPost.updatedAt,
      isNew: false,
    });
  } catch (error) {
    logError("Auto-save failed:", error);
    return NextResponse.json({ error: "Auto-save failed" }, { status: 500 });
  }
}
