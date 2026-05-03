import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import type { Post } from "@/types/post.types";

const beginPostReturnTransitionMock = mock(() => true);
let container: HTMLDivElement;
let root: Root | null = null;

mock.module("next/image", () => ({
  default: ({
    alt,
    blurDataURL: _blurDataURL,
    fetchPriority: _fetchPriority,
    fill: _fill,
    placeholder: _placeholder,
    priority: _priority,
    quality: _quality,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    blurDataURL?: string;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    unoptimized?: boolean;
  }) => React.createElement("img", { alt, ...props }),
}));

mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

mock.module("@/components/features/posts/post-open-transition-provider", () => ({
  measureTransitionRect: () => ({
    top: 0,
    inlineStart: 0,
    width: 100,
    height: 100,
    borderRadius: 8,
  }),
  usePostOpenTransition: () => ({
    beginPostReturnTransition: beginPostReturnTransitionMock,
    isPostTransitionActive: () => false,
    registerPostTransitionTarget: mock(() => undefined),
    shouldDelayPostBody: () => false,
  }),
}));

const post: Post = {
  id: "post-123",
  title: "כותרת בדיקה",
  content: "תוכן בדיקה",
  coverImage: "https://example.com/cover.jpg",
  description: "תיאור בדיקה",
  date: "2025-03-15T12:00:00.000Z",
  author: "כותב",
  tags: ["בית ספר"],
  category: "חדשות",
  status: "published",
  createdAt: "2025-03-15T12:00:00.000Z",
  updatedAt: "2025-03-15T12:00:00.000Z",
};

describe("PostPageTransitionShell", () => {
  beforeEach(() => {
    beginPostReturnTransitionMock.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      flushSync(() => {
        root?.unmount();
      });
      root = null;
    }

    container.remove();
  });

  async function renderShell() {
    const { PostPageTransitionShell } = await import(
      "../post-page-transition-shell"
    );

    root = createRoot(container);
    flushSync(() => {
      root?.render(
        <PostPageTransitionShell post={post} wordCount={260}>
          <p>body</p>
        </PostPageTransitionShell>,
      );
    });
  }

  function getReturnLink() {
    const link = container.querySelector<HTMLAnchorElement>("a");

    if (!link) {
      throw new Error("Expected return link to render");
    }

    return link;
  }

  it("links back to the concrete archive route instead of the redirecting home route", async () => {
    await renderShell();
    const link = getReturnLink();

    expect(link.getAttribute("href")).toBe("/2025/march");
  });

  it("starts a return transition before archive navigation", async () => {
    await renderShell();

    getReturnLink().dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        button: 0,
        cancelable: true,
      }),
    );

    expect(beginPostReturnTransitionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "/2025/march",
        postId: "post-123",
      }),
    );
  });
});
