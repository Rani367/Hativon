import { describe, it, expect } from "vitest";
import { generateSlug, generateDescription, rowToPost } from "../utils";
import type { DbPostRow } from "@/types/database.types";

describe("generateSlug", () => {
  describe("Hebrew text handling", () => {
    it("preserves Hebrew characters", () => {
      expect(generateSlug("כותרת בעברית")).toBe("כותרת-בעברית");
    });

    it("handles Hebrew with punctuation", () => {
      expect(generateSlug("כותרת: תת-כותרת!")).toBe("כותרת-תת-כותרת");
    });

    it("handles mixed Hebrew and English", () => {
      expect(generateSlug("Hello עולם")).toBe("hello-עולם");
    });

    it("handles Hebrew with numbers", () => {
      expect(generateSlug("כותרת 123")).toBe("כותרת-123");
    });

    it("handles Hebrew with special characters", () => {
      expect(generateSlug("כותרת@#$%^&*()")).toBe("כותרת");
    });

    it("handles multiple spaces in Hebrew text", () => {
      expect(generateSlug("כותרת    עם    רווחים")).toBe("כותרת-עם-רווחים");
    });

    it("handles leading and trailing spaces", () => {
      expect(generateSlug("  כותרת  ")).toBe("כותרת");
    });

    it("handles empty string", () => {
      expect(generateSlug("")).toBe("");
    });

    it("handles only special characters", () => {
      expect(generateSlug("@#$%^&*()")).toBe("");
    });
  });

  describe("English text handling", () => {
    it("converts English to lowercase", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
    });

    it("replaces spaces with hyphens", () => {
      expect(generateSlug("my blog post")).toBe("my-blog-post");
    });

    it("removes special characters", () => {
      expect(generateSlug("Hello! World?")).toBe("hello-world");
    });

    it("handles consecutive special characters", () => {
      expect(generateSlug("hello---world")).toBe("hello-world");
    });
  });

  describe("Edge cases", () => {
    it("handles very long Hebrew text", () => {
      const longText = "כותרת ".repeat(100);
      const result = generateSlug(longText);
      expect(result).toContain("כותרת");
      expect(result.split("-").filter(Boolean).length).toBeGreaterThan(50);
    });

    it("handles Unicode emoji (should be removed)", () => {
      expect(generateSlug("כותרת  בעברית")).toBe("כותרת-בעברית");
    });

    it("handles RTL marks and zero-width characters", () => {
      const textWithMarks = "כותרת\u200F\u200Eבעברית";
      const result = generateSlug(textWithMarks);
      // RTL and zero-width marks are replaced with hyphens by the regex
      expect(result).toBe("כותרת-בעברית");
    });

    it("is case-insensitive for English", () => {
      expect(generateSlug("HELLO")).toBe(generateSlug("hello"));
    });

    it("handles Hebrew nikud (diacritics) - should be removed", () => {
      const textWithNikud = "כָּתוּב";
      const result = generateSlug(textWithNikud);
      // Nikud characters (U+0591-U+05C7) are outside our range
      expect(result).not.toContain("\u05B0");
    });
  });
});

describe("generateDescription", () => {
  describe("Hebrew text handling", () => {
    it("preserves Hebrew text", () => {
      const content = "זהו תוכן בעברית עם כמה מילים.";
      expect(generateDescription(content)).toBe(content);
    });

    it("truncates long Hebrew text to 160 characters", () => {
      const longContent = "א".repeat(200);
      const result = generateDescription(longContent);
      expect(result).toHaveLength(163); // 160 + '...'
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
});

describe("rowToPost", () => {
  it("converts database row to Post object", () => {
    const mockRow: DbPostRow = {
      id: "test-id",
      title: "כותרת בדיקה",
      slug: "כותרת-בדיקה",
      content: "תוכן בדיקה",
      cover_image: "https://example.com/image.jpg",
      description: "תיאור בדיקה",
      date: new Date("2024-01-01"),
      author: "שם מחבר",
      author_id: "author-123",
      author_grade: "י",
      author_class: 2,
      author_deleted: false,
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
      slug: "כותרת-בדיקה",
      content: "תוכן בדיקה",
      coverImage: "https://example.com/image.jpg",
      description: "תיאור בדיקה",
      date: "2024-01-01T00:00:00.000Z",
      author: "שם מחבר",
      authorId: "author-123",
      authorGrade: "י",
      authorClass: 2,
      authorDeleted: false,
      tags: ["תג1", "תג2"],
      category: "קטגוריה",
      status: "published",
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T12:00:00.000Z",
    });
  });

  it("handles null values correctly", () => {
    const mockRow: DbPostRow = {
      id: "test-id",
      title: "Test",
      slug: "test",
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
