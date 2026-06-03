import { describe, it, expect } from "bun:test";
import {
  generateDescription,
  MAX_DESCRIPTION_LENGTH,
  rowToPost,
  truncateDescription,
} from "../utils";
import type { DbPostRow } from "@/types/database.types";

describe("generateDescription", () => {
  describe("Hebrew text handling", () => {
    it("preserves Hebrew text", () => {
      const content = "זהו תוכן בעברית עם כמה מילים.";
      expect(generateDescription(content)).toBe(content);
    });

    it("truncates long Hebrew text to the shared description limit", () => {
      const longContent = "א".repeat(400);
      const result = generateDescription(longContent);
      expect(result).toHaveLength(MAX_DESCRIPTION_LENGTH + 3);
      expect(result.endsWith("...")).toBe(true);
    });

    it("removes Hebrew markdown syntax", () => {
      const content = "**טקסט מודגש** ו-*טקסט נטוי*";
      const result = generateDescription(content);
      expect(result).toBe("טקסט מודגש ו-טקסט נטוי");
    });

    it("removes code blocks with Hebrew content", () => {
      const content = "```\nקוד בעברית\n```\nטקסט רגיל";
      const result = generateDescription(content);
      expect(result).toBe("טקסט רגיל");
    });
  });

  describe("Markdown removal", () => {
    it("removes code blocks", () => {
      const content = "```javascript\nconst x = 1;\n```\nRegular text";
      expect(generateDescription(content)).toBe("Regular text");
    });

    it("removes inline code backticks and content", () => {
      const content = "Use `console.log()` to debug";
      // Inline code (backticks and content inside) is completely removed
      expect(generateDescription(content)).toBe("Use to debug");
    });

    it("removes headings", () => {
      const content = "# Title\nContent here";
      expect(generateDescription(content)).toBe("Title Content here");
    });

    it("removes emphasis markers", () => {
      const content = "**bold** and *italic* and ~strikethrough~";
      expect(generateDescription(content)).toBe(
        "bold and italic and strikethrough",
      );
    });

    it("removes link markdown syntax", () => {
      const content = "[link text](url) and [another](url2)";
      // Brackets and parentheses are removed, text remains
      expect(generateDescription(content)).toBe("link texturl and anotherurl2");
    });
  });

  describe("Whitespace normalization", () => {
    it("normalizes multiple spaces", () => {
      const content = "text    with    spaces";
      expect(generateDescription(content)).toBe("text with spaces");
    });

    it("normalizes newlines", () => {
      const content = "line1\n\nline2\n\n\nline3";
      expect(generateDescription(content)).toBe("line1 line2 line3");
    });

    it("trims leading and trailing whitespace", () => {
      const content = "   text   ";
      expect(generateDescription(content)).toBe("text");
    });
  });

  describe("Edge cases", () => {
    it("handles empty string", () => {
      expect(generateDescription("")).toBe("");
    });

    it("handles only markdown syntax", () => {
      expect(generateDescription("**  **")).toBe("");
    });

    it("handles mixed Hebrew and English with markdown", () => {
      const content = "**Hello** עולם with *text*";
      expect(generateDescription(content)).toBe("Hello עולם with text");
    });

    it("preserves Hebrew punctuation", () => {
      const content = "שאלה? תשובה! הערה.";
      expect(generateDescription(content)).toBe("שאלה? תשובה! הערה.");
    });
  });

  describe("truncateDescription", () => {
    it("trims surrounding whitespace", () => {
      expect(truncateDescription("  short text  ")).toBe("short text");
    });

    it("truncates long descriptions to the shared limit", () => {
      const result = truncateDescription("a".repeat(MAX_DESCRIPTION_LENGTH + 10));
      expect(result).toBe("a".repeat(MAX_DESCRIPTION_LENGTH) + "...");
    });
  });
});

describe("rowToPost", () => {
  it("converts database row to Post object", () => {
    const mockRow: DbPostRow = {
      id: "test-id",
      title: "כותרת בדיקה",
      content: "תוכן בדיקה",
      cover_image: "https://example.com/image.jpg",
      description: "תיאור בדיקה",
      date: new Date("2024-01-01"),
      author: "שם מחבר",
      author_id: "author-123",
      author_grade: "י",
      author_class: 2,
      author_deleted: false,
      ai_generated_image: true,
      tags: ["תג1", "תג2"],
      category: "קטגוריה",
      status: "published",
      created_at: new Date("2024-01-01T10:00:00Z"),
      updated_at: new Date("2024-01-01T12:00:00Z"),
    };

    const result = rowToPost(mockRow);

    expect(result).toEqual({
      id: "test-id",
      title: "כותרת בדיקה",
      content: "תוכן בדיקה",
      coverImage: "https://example.com/image.jpg",
      description: "תיאור בדיקה",
      wordCount: 2,
      date: "2024-01-01T00:00:00.000Z",
      author: "שם מחבר",
      authorId: "author-123",
      authorGrade: "י",
      authorClass: 2,
      authorDeleted: false,
      isTeacherPost: false,
      aiGeneratedImage: true,
      tags: ["תג1", "תג2"],
      category: "קטגוריה",
      status: "published",
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T12:00:00.000Z",
    });
  });

  it("defaults aiGeneratedImage to false when column is absent/null", () => {
    const mockRow: DbPostRow = {
      id: "test-id",
      title: "Test",
      content: "Content",
      cover_image: "https://example.com/image.jpg",
      description: "Desc",
      date: new Date("2024-01-01"),
      author: null,
      author_id: null,
      author_grade: null,
      author_class: null,
      author_deleted: false,
      tags: null,
      category: null,
      status: "published",
      created_at: new Date("2024-01-01T10:00:00Z"),
      updated_at: new Date("2024-01-01T12:00:00Z"),
    };

    expect(rowToPost(mockRow).aiGeneratedImage).toBe(false);
  });

  it("handles null values correctly", () => {
    const mockRow: DbPostRow = {
      id: "test-id",
      title: "Test",
      content: "Content",
      cover_image: null,
      description: "Desc",
      date: new Date("2024-01-01"),
      author: null,
      author_id: null,
      author_grade: null,
      author_class: null,
      author_deleted: false,
      tags: null,
      category: null,
      status: "draft",
      created_at: new Date("2024-01-01T10:00:00Z"),
      updated_at: new Date("2024-01-01T12:00:00Z"),
    };

    const result = rowToPost(mockRow);

    expect(result.coverImage).toBeUndefined();
    expect(result.author).toBeUndefined();
    expect(result.authorId).toBeUndefined();
    expect(result.category).toBeUndefined();
  });
});
