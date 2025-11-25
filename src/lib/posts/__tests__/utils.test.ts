import { describe, it, expect } from "vitest";
import {
  generateSlug,
  generateDescription,
  MAX_DESCRIPTION_LENGTH,
} from "../utils";

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
});
