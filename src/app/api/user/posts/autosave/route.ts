import { NextResponse } from "next/server";
import { autoSavePayloadSchema } from "@/lib/autosave";
import { isSameOrigin } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { canEditPost } from "@/lib/posts/rules";
import {
  createDraft,
  getStudioPost,
  updatePostFields,
} from "@/lib/posts/studio";

/**
 * A route handler rather than a Server Action because the hook needs fetch,
 * abort and a 409, and because open tabs must keep saving through a deploy.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = autoSavePayloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { postId, expectedVersion, ...fields } = payload.data;

  if (!postId) {
    if (!fields.title?.trim() && !fields.content?.trim()) {
      return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
    }

    const draft = await createDraft(user, fields);
    return NextResponse.json({
      success: true,
      id: draft.id,
      updatedAt: draft.updatedAt,
      isNew: true,
    });
  }

  const post = await getStudioPost(postId);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditPost(user, post)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Published posts only change when the writer presses save, so half-finished
  // edits never reach readers.
  if (post.status === "published") {
    return NextResponse.json({ error: "Published" }, { status: 400 });
  }

  if (
    expectedVersion &&
    new Date(post.updatedAt).getTime() > new Date(expectedVersion).getTime()
  ) {
    return NextResponse.json(
      {
        conflict: true,
        serverVersion: post.updatedAt,
        serverContent: {
          title: post.title,
          content: post.content,
          description: post.description,
          coverImage: post.coverImage,
          customAuthor: post.author,
        },
      },
      { status: 409 },
    );
  }

  const updated = await updatePostFields(user, post, fields);
  return NextResponse.json({
    success: true,
    id: updated.id,
    updatedAt: updated.updatedAt,
    isNew: false,
  });
}
