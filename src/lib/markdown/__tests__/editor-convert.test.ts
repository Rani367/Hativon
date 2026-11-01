import { describe, expect, it } from "bun:test";
import { htmlToMarkdown, markdownToHtml } from "../editor-convert";

const roundTrip = (markdown: string) => htmlToMarkdown(markdownToHtml(markdown));

describe("editor round trip", () => {
  it("keeps images", () => {
    const image = "![כיתוב](https://example.com/a.webp)";
    expect(roundTrip(image)).toBe(image);
  });

  it("keeps strikethrough", () => {
    expect(roundTrip("~~מחוק~~")).toBe("~~מחוק~~");
  });

  it("keeps tables", () => {
    const table = "| א | ב |\n| --- | --- |\n| 1 | 2 |";
    expect(roundTrip(table)).toBe(table);
  });

  it("keeps blank lines", () => {
    expect(htmlToMarkdown("<p>א</p><p></p><p>ב</p>")).toContain("&nbsp;");
  });

  it("doesn't turn single newlines into hard breaks", () => {
    expect(markdownToHtml("א\nב")).not.toContain("<br");
  });

  it("drops raw HTML instead of reviving it", () => {
    expect(markdownToHtml('<div class="x">א</div>')).not.toContain("<div");
  });
});
