import { describe, it, expect } from "vitest";
import {
  generateSlug,
  generateDescription,
  rowToPost,
  MAX_DESCRIPTION_LENGTH,
} from "../utils";
import type { DbPostRow } from "@/types/database.types";

describe("Post Utilities", () => {
  describe("generateSlug", () => {
    it("converts title to lowercase slug with hyphens", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
      expect(generateSlug("Multiple   Spaces   Here")).toBe(
        "multiple-spaces-here",
      );
      expect(generateSlug("Post 123 Title")).toBe("post-123-title");
      expect(generateSlug("CamelCaseTitle")).toBe("camelcasetitle");
    });

    it("removes special characters and trims hyphens", () => {
      expect(generateSlug("Hello! @World# $Test%")).toBe("hello-world-test");
      expect(generateSlug("  !Hello World!  ")).toBe("hello-world");
      expect(generateSlug("Hello, World! How are you?")).toBe(
        "hello-world-how-are-you",
      );
      expect(generateSlug("title_with_underscores")).toBe(
        "title-with-underscores",
      );
    });

    it("handles edge cases", () => {
      expect(generateSlug("")).toBe("");
      expect(generateSlug("!@#$%^&*()")).toBe("");
      expect(generateSlug("כותרת הפוסט")).toBe("");
    });
  });

  describe("generateDescription", () => {
    it("strips markdown formatting", () => {
      expect(generateDescription("**Bold** and *italic* text")).toBe(
        "Bold and italic text",
      );
      expect(generateDescription("# Header\n## Subheader\nContent")).toBe(
        "Header Subheader Content",
      );
      expect(
        generateDescription(
          "Text before ```javascript\nconst x = 1;\n``` text after",
        ),
      ).toBe("Text before text after");
      expect(generateDescription("Use `console.log()` for debugging")).toBe(
        "Use for debugging",
      );
    });

    it("normalizes whitespace", () => {
      expect(generateDescription("Text   with\n\nmultiple   spaces")).toBe(
        "Text with multiple spaces",
      );
      expect(generateDescription("  Trimmed content  ")).toBe(
        "Trimmed content",
      );
    });

    it("truncates to MAX_DESCRIPTION_LENGTH with ellipsis", () => {
      const longContent = "A".repeat(200);
      const description = generateDescription(longContent);

      expect(description.length).toBe(MAX_DESCRIPTION_LENGTH + 3);
      expect(description.endsWith("...")).toBe(true);

      expect(generateDescription("Short description")).toBe(
        "Short description",
      );
      expect(generateDescription("A".repeat(MAX_DESCRIPTION_LENGTH))).toBe(
        "A".repeat(MAX_DESCRIPTION_LENGTH),
      );
    });

    it("handles edge cases", () => {
      expect(generateDescription("")).toBe("");

      const complexMarkdown = `
        # Title
        This is **bold** and *italic* text.
        \`\`\`javascript
        const code = "removed";
        \`\`\`
        [Link](url) and \`inline code\`.
      `;
      const description = generateDescription(complexMarkdown);
      expect(description).not.toContain("**");
      expect(description).not.toContain("```");
      expect(description).not.toContain("`");
    });
  });

  describe("MAX_DESCRIPTION_LENGTH constant", () => {
    it("is 160 characters", () => {
      expect(MAX_DESCRIPTION_LENGTH).toBe(160);
    });
  });

  describe("rowToPost", () => {
    it("converts database row to Post object with all fields", () => {
      const dbRow: DbPostRow = {
        id: "post-123",
        title: "Test Post",
        slug: "test-post",
        content: "Test content",
        cover_image: "https://example.com/image.jpg",
        description: "Test description",
        date: new Date("2025-01-15T10:00:00Z"),
        author: "Test Author",
        author_id: "user-456",
        author_grade: "י",
        author_class: 3,
        author_deleted: false,
        tags: ["tag1", "tag2"],
        category: "News",
        status: "published",
        created_at: new Date("2025-01-01T00:00:00Z"),
        updated_at: new Date("2025-01-15T12:00:00Z"),
      };

      const result = rowToPost(dbRow);

      expect(result).toEqual({
        id: "post-123",
        title: "Test Post",
        slug: "test-post",
        content: "Test content",
        coverImage: "https://example.com/image.jpg",
        description: "Test description",
        date: "2025-01-15T10:00:00.000Z",
        author: "Test Author",
        authorId: "user-456",
        authorGrade: "י",
        authorClass: 3,
        authorDeleted: false,
        tags: ["tag1", "tag2"],
        category: "News",
        status: "published",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-15T12:00:00.000Z",
      });
    });

    it("handles null optional fields correctly", () => {
      const dbRow: DbPostRow = {
        id: "post-minimal",
        title: "Minimal Post",
        slug: "minimal-post",
        content: "Minimal content",
        cover_image: null,
        description: "Description",
        date: new Date("2025-01-01T00:00:00Z"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        author_deleted: undefined,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01T00:00:00Z"),
        updated_at: new Date("2025-01-01T00:00:00Z"),
      };

      const result = rowToPost(dbRow);

      expect(result.coverImage).toBeUndefined();
      expect(result.author).toBeUndefined();
      expect(result.authorId).toBeUndefined();
      expect(result.authorGrade).toBeUndefined();
      expect(result.authorClass).toBeUndefined();
      expect(result.authorDeleted).toBe(false);
      expect(result.category).toBeUndefined();
    });

    it("converts snake_case to camelCase", () => {
      const dbRow: DbPostRow = {
        id: "post-123",
        title: "Test",
        slug: "test",
        content: "Content",
        cover_image: "image.jpg",
        description: "Desc",
        date: new Date("2025-01-01"),
        author: "Author",
        author_id: "user-1",
        author_grade: "ח",
        author_class: 2,
        author_deleted: true,
        tags: [],
        category: "Tech",
        status: "published",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      const result = rowToPost(dbRow);

      expect(result).toHaveProperty("coverImage");
      expect(result).toHaveProperty("authorId");
      expect(result).toHaveProperty("authorGrade");
      expect(result).toHaveProperty("authorClass");
      expect(result).toHaveProperty("authorDeleted");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("cover_image");
      expect(result).not.toHaveProperty("author_id");
    });

    it("converts dates to ISO strings", () => {
      const testDate = new Date("2025-06-15T14:30:00Z");
      const dbRow: DbPostRow = {
        id: "post-date",
        title: "Date Test",
        slug: "date-test",
        content: "Content",
        cover_image: null,
        description: "Desc",
        date: testDate,
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        author_deleted: undefined,
        tags: [],
        category: null,
        status: "draft",
        created_at: testDate,
        updated_at: testDate,
      };

      const result = rowToPost(dbRow);

      expect(result.date).toBe("2025-06-15T14:30:00.000Z");
      expect(result.createdAt).toBe("2025-06-15T14:30:00.000Z");
      expect(result.updatedAt).toBe("2025-06-15T14:30:00.000Z");
      expect(typeof result.date).toBe("string");
      expect(typeof result.createdAt).toBe("string");
      expect(typeof result.updatedAt).toBe("string");
    });

    it("handles draft and published status correctly", () => {
      const draftRow: DbPostRow = {
        id: "post-1",
        title: "Draft",
        slug: "draft",
        content: "Content",
        cover_image: null,
        description: "Desc",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        author_deleted: undefined,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      const publishedRow: DbPostRow = {
        ...draftRow,
        id: "post-2",
        status: "published",
      };

      expect(rowToPost(draftRow).status).toBe("draft");
      expect(rowToPost(publishedRow).status).toBe("published");
    });

    it("preserves empty tags array", () => {
      const dbRow: DbPostRow = {
        id: "post-tags",
        title: "Tags Test",
        slug: "tags-test",
        content: "Content",
        cover_image: null,
        description: "Desc",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        author_deleted: undefined,
        tags: [],
        category: null,
        status: "draft",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      const result = rowToPost(dbRow);

      expect(result.tags).toEqual([]);
      expect(Array.isArray(result.tags)).toBe(true);
    });

    it("handles authorDeleted flag correctly", () => {
      const deletedRow: DbPostRow = {
        id: "post-deleted",
        title: "Deleted Author",
        slug: "deleted-author",
        content: "Content",
        cover_image: null,
        description: "Desc",
        date: new Date("2025-01-01"),
        author: null,
        author_id: null,
        author_grade: null,
        author_class: null,
        author_deleted: true,
        tags: [],
        category: null,
        status: "published",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      };

      const activeRow: DbPostRow = {
        ...deletedRow,
        id: "post-active",
        author_deleted: false,
      };

      const nullRow: DbPostRow = {
        ...deletedRow,
        id: "post-null",
        author_deleted: undefined,
      };

      expect(rowToPost(deletedRow).authorDeleted).toBe(true);
      expect(rowToPost(activeRow).authorDeleted).toBe(false);
      expect(rowToPost(nullRow).authorDeleted).toBe(false);
    });
  });
});
