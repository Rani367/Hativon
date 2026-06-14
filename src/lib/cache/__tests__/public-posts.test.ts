import { describe, it, expect, mock, beforeEach } from "bun:test";
import { revalidatePath } from "next/cache";
import type { Post } from "@/types/post.types";
import { revalidatePublicPostChange } from "@/lib/cache/public-posts";

// resolveMergeGroup (called internally) reads merge config from the mocked DB,
// which returns no rows -> no merge group, so revalidation targets the post's
// own month plus the shared public paths. We deliberately do NOT mock the
// merged-issues module here: Bun's mock.module is process-global and would leak
// into other test files.
const revalidatePathMock = revalidatePath as unknown as ReturnType<typeof mock>;

function publishedPost(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-1",
    title: "כותרת",
    content: "תוכן הכתבה",
    coverImage: "https://example.com/cover.jpg",
    description: "תיאור",
    wordCount: 2,
    date: "2026-06-01T00:00:00.000Z",
    author: "כותב",
    aiGeneratedImage: false,
    tags: [],
    status: "published",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("revalidatePublicPostChange", () => {
  beforeEach(() => {
    revalidatePathMock.mockClear();
  });

  it("revalidates public pages when only aiGeneratedImage changes", async () => {
    const before = publishedPost({ aiGeneratedImage: false });
    const after = publishedPost({ aiGeneratedImage: true });

    await revalidatePublicPostChange(before, after);

    // The AI flag must be part of the public signature, otherwise the badge
    // (rendered from this flag) never reaches the statically-cached pages.
    expect(revalidatePathMock).toHaveBeenCalled();
    const revalidatedPaths = revalidatePathMock.mock.calls.map(
      (call) => call[0],
    );
    expect(revalidatedPaths).toContain("/");
  });

  it("does not revalidate when the public signature is unchanged", async () => {
    const before = publishedPost();
    const after = publishedPost();

    await revalidatePublicPostChange(before, after);

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
