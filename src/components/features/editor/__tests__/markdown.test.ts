import { describe, it, expect } from "bun:test";
import { htmlToMarkdown, markdownToHtml } from "../markdown";
import { getWordCount } from "@/lib/utils/text-utils";
import { generateDescription } from "@/lib/posts/utils";

describe("editor markdown conversion - blank line preservation", () => {
  it("preserves a single blank line between paragraphs", () => {
    const md = htmlToMarkdown("<p>A</p><p></p><p>B</p>");
    expect(md).toContain("&nbsp;");
    expect(md).toBe("A\n\n&nbsp;\n\nB");
  });

  it("preserves multiple consecutive blank lines", () => {
    const md = htmlToMarkdown("<p>A</p><p></p><p></p><p>B</p>");
    expect(md).toBe("A\n\n&nbsp;\n\n&nbsp;\n\nB");
  });

  it("leaves normal paragraph spacing unchanged", () => {
    expect(htmlToMarkdown("<p>A</p><p>B</p>")).toBe("A\n\nB");
  });

  it("treats a genuinely empty editor as empty", () => {
    expect(htmlToMarkdown("")).toBe("");
    expect(htmlToMarkdown("<p></p>")).toBe("");
  });

  it("round-trips blank lines stably (markdown -> html -> markdown)", () => {
    for (const md of ["A\n\n&nbsp;\n\nB", "A\n\n&nbsp;\n\n&nbsp;\n\nB", "A\n\nB"]) {
      expect(htmlToMarkdown(markdownToHtml(md))).toBe(md);
    }
  });
});

describe("editor markdown conversion - Hebrew / RTL content", () => {
  it("round-trips Hebrew paragraphs with a preserved blank line", () => {
    const md = "שלום עולם\n\n&nbsp;\n\nכתבה חדשה";
    expect(htmlToMarkdown(markdownToHtml(md))).toBe(md);
  });

  it("round-trips mixed Hebrew and Latin text across paragraphs", () => {
    const md = "שלום world\n\nשורה שנייה";
    expect(htmlToMarkdown(markdownToHtml(md))).toBe(md);
  });

  it("counts Hebrew words and ignores blank-line markers", () => {
    expect(getWordCount("שלום\n\n&nbsp;\n\nעולם")).toBe(2);
  });

  it("strips blank-line markers from a generated Hebrew description", () => {
    const desc = generateDescription("שלום\n\n&nbsp;\n\nעולם");
    expect(desc).not.toContain("&nbsp;");
    expect(desc).toBe("שלום עולם");
  });
});

describe("blank-line markers do not leak into derived text", () => {
  it("getWordCount ignores blank-line markers", () => {
    expect(getWordCount("hello\n\n&nbsp;\n\n&nbsp;\n\nworld")).toBe(2);
  });

  it("generateDescription strips blank-line markers", () => {
    const desc = generateDescription("hello\n\n&nbsp;\n\nworld");
    expect(desc).not.toContain("&nbsp;");
    expect(desc).toBe("hello world");
  });
});
