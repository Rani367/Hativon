import { describe, expect, it } from "bun:test";
import {
  getPostCardImageUrl,
  isOptimizedPostCoverUrl,
} from "../post-images";

describe("post image URL helpers", () => {
  it("derives card URL from optimized full image URL", () => {
    expect(
      getPostCardImageUrl(
        "https://example.public.blob.vercel-storage.com/posts/123/full.webp",
      ),
    ).toBe("https://example.public.blob.vercel-storage.com/posts/123/card.webp");
  });

  it("preserves query params when deriving card URL", () => {
    expect(
      getPostCardImageUrl(
        "https://example.com/posts/123/full.gif?download=1",
      ),
    ).toBe("https://example.com/posts/123/card.webp?download=1");
  });

  it("returns legacy URLs unchanged", () => {
    const url = "https://example.com/posts/legacy-image.jpg";
    expect(getPostCardImageUrl(url)).toBe(url);
    expect(isOptimizedPostCoverUrl(url)).toBe(false);
  });

  it("detects optimized cover URLs", () => {
    expect(
      isOptimizedPostCoverUrl("https://example.com/posts/123/full.webp"),
    ).toBe(true);
  });
});
