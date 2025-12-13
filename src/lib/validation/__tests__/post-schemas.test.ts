import { describe, it, expect } from "vitest";
import {
  postStatusSchema,
  postTitleSchema,
  postContentSchema,
  postDescriptionSchema,
  coverImageSchema,
  tagsSchema,
  categorySchema,
  postInputSchema,
  postUpdateSchema,
} from "../schemas";

describe("Post Validation Schemas", () => {
  describe("postStatusSchema", () => {
    it("accepts valid statuses", () => {
      expect(postStatusSchema.safeParse("draft").success).toBe(true);
      expect(postStatusSchema.safeParse("published").success).toBe(true);
    });

    it("rejects invalid statuses", () => {
      expect(postStatusSchema.safeParse("pending").success).toBe(false);
      expect(postStatusSchema.safeParse("").success).toBe(false);
    });
  });

  describe("postTitleSchema", () => {
    it("accepts valid titles", () => {
      expect(postTitleSchema.safeParse("Test Title").success).toBe(true);
      expect(postTitleSchema.safeParse("כותרת בעברית").success).toBe(true);
    });

    it("rejects empty title", () => {
      expect(postTitleSchema.safeParse("").success).toBe(false);
    });

    it("rejects title over 200 characters", () => {
      expect(postTitleSchema.safeParse("a".repeat(201)).success).toBe(false);
    });
  });

  describe("postContentSchema", () => {
    it("accepts valid content", () => {
      expect(postContentSchema.safeParse("Some content").success).toBe(true);
    });

    it("rejects empty content", () => {
      expect(postContentSchema.safeParse("").success).toBe(false);
    });

    it("rejects content over 50000 characters", () => {
      expect(postContentSchema.safeParse("a".repeat(50001)).success).toBe(
        false,
      );
    });
  });

  describe("postDescriptionSchema", () => {
    it("accepts valid descriptions", () => {
      expect(postDescriptionSchema.safeParse("A short desc").success).toBe(
        true,
      );
    });

    it("accepts undefined (optional)", () => {
      expect(postDescriptionSchema.safeParse(undefined).success).toBe(true);
    });

    it("rejects descriptions over 500 characters", () => {
      expect(postDescriptionSchema.safeParse("a".repeat(501)).success).toBe(
        false,
      );
    });
  });

  describe("coverImageSchema", () => {
    it("accepts valid URLs", () => {
      expect(
        coverImageSchema.safeParse("https://example.com/image.jpg").success,
      ).toBe(true);
    });

    it("accepts empty string (optional)", () => {
      expect(coverImageSchema.safeParse("").success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      expect(coverImageSchema.safeParse(undefined).success).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(coverImageSchema.safeParse("not-a-url").success).toBe(false);
    });
  });

  describe("tagsSchema", () => {
    it("accepts valid tags array", () => {
      expect(tagsSchema.safeParse(["tag1", "tag2"]).success).toBe(true);
    });

    it("accepts empty array", () => {
      expect(tagsSchema.safeParse([]).success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      expect(tagsSchema.safeParse(undefined).success).toBe(true);
    });

    it("rejects more than 10 tags", () => {
      const manyTags = Array(11).fill("tag");
      expect(tagsSchema.safeParse(manyTags).success).toBe(false);
    });

    it("rejects empty string tags", () => {
      expect(tagsSchema.safeParse([""]).success).toBe(false);
    });

    it("rejects tags over 50 characters", () => {
      expect(tagsSchema.safeParse(["a".repeat(51)]).success).toBe(false);
    });
  });

  describe("categorySchema", () => {
    it("accepts valid category", () => {
      expect(categorySchema.safeParse("news").success).toBe(true);
    });

    it("accepts empty string (optional)", () => {
      expect(categorySchema.safeParse("").success).toBe(true);
    });

    it("rejects category over 50 characters", () => {
      expect(categorySchema.safeParse("a".repeat(51)).success).toBe(false);
    });
  });

  describe("postInputSchema", () => {
    const validPost = {
      title: "Test Post",
      content: "Test content here",
    };

    it("accepts minimal valid post", () => {
      expect(postInputSchema.safeParse(validPost).success).toBe(true);
    });

    it("accepts full post with all fields", () => {
      const fullPost = {
        ...validPost,
        description: "A description",
        coverImage: "https://example.com/image.jpg",
        author: "Test Author",
        authorId: "550e8400-e29b-41d4-a716-446655440000",
        authorGrade: "ח",
        authorClass: 2,
        tags: ["news", "school"],
        category: "events",
        status: "published",
      };
      expect(postInputSchema.safeParse(fullPost).success).toBe(true);
    });

    it("validates authorId as UUID", () => {
      const invalidUuid = {
        ...validPost,
        authorId: "not-a-uuid",
      };
      expect(postInputSchema.safeParse(invalidUuid).success).toBe(false);
    });
  });

  describe("postUpdateSchema", () => {
    it("accepts partial updates", () => {
      expect(postUpdateSchema.safeParse({ title: "New Title" }).success).toBe(
        true,
      );
      expect(
        postUpdateSchema.safeParse({ status: "draft" }).success,
      ).toBe(true);
    });

    it("rejects empty update object", () => {
      const result = postUpdateSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
