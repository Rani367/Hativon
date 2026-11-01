import { describe, expect, it } from "bun:test";
import { getPostCardImageUrl } from "../post-images";

const host = "https://qulqrj5yy3ynqlic.public.blob.vercel-storage.com";

describe("getPostCardImageUrl", () => {
  it("derives the card from a full image", () => {
    expect(getPostCardImageUrl(`${host}/posts/123-abc/full.webp`)).toBe(
      `${host}/posts/123-abc/card.webp`,
    );
  });

  it("derives a webp card from a full gif", () => {
    expect(getPostCardImageUrl(`${host}/posts/123-abc/full.gif`)).toBe(
      `${host}/posts/123-abc/card.webp`,
    );
  });

  it("keeps query strings", () => {
    expect(getPostCardImageUrl(`${host}/posts/1/full.webp?v=2`)).toBe(
      `${host}/posts/1/card.webp?v=2`,
    );
  });

  it("leaves images without a card variant alone", () => {
    const legacy = `${host}/posts/123-abc.jpg`;
    expect(getPostCardImageUrl(legacy)).toBe(legacy);

    const external = "https://example.com/photo.png";
    expect(getPostCardImageUrl(external)).toBe(external);
  });

  it("returns nothing for a post without a cover", () => {
    expect(getPostCardImageUrl(undefined)).toBeUndefined();
    expect(getPostCardImageUrl(null)).toBeUndefined();
    expect(getPostCardImageUrl("")).toBeUndefined();
  });

  it("returns a value that isn't a URL unchanged", () => {
    expect(getPostCardImageUrl("not a url")).toBe("not a url");
  });
});
