import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ArticleBody } from "../article-body";

const render = (content: string) =>
  renderToStaticMarkup(<ArticleBody content={content} />);

describe("ArticleBody", () => {
  describe("keeps old articles rendering the way they always have", () => {
    it("drops raw HTML rather than rendering it", () => {
      const html = render('לפני<div class="x">באמצע</div>אחרי');

      expect(html).not.toContain('<div class="x"');
      expect(html).toContain("לפני");
    });

    it("keeps a single newline as a space, not a line break", () => {
      const html = render("שורה ראשונה\nשורה שנייה");

      expect(html).not.toContain("<br");
      expect(html).toContain("שורה ראשונה\nשורה שנייה");
    });

    it("keeps the blank-line marker as an empty paragraph", () => {
      const html = render("ראשונה\n\n&nbsp;\n\nאחרונה");

      expect(html.match(/<p>/g)).toHaveLength(3);
      expect(html).toContain("<p> </p>");
    });

    it("renders hard line breaks written with two spaces", () => {
      expect(render("ראשונה  \nשנייה")).toContain("<br/>");
    });

    it("renders the Markdown the editor produces", () => {
      const html = render(
        "**מודגש** *נטוי*\n\n- פריט\n\n> ציטוט\n\n[קישור](https://example.com)",
      );

      expect(html).toContain("<strong>מודגש</strong>");
      expect(html).toContain("<em>נטוי</em>");
      expect(html).toContain("<li>פריט</li>");
      expect(html).toContain("<blockquote>");
      expect(html).toContain('href="https://example.com"');
    });

    it("renders GFM tables and strikethrough", () => {
      const html = render("| א | ב |\n| - | - |\n| 1 | 2 |\n\n~~מחוק~~");

      expect(html).toContain("<table>");
      expect(html).toContain("<del>מחוק</del>");
    });
  });

  describe("safety", () => {
    it("removes script tags", () => {
      const html = render("<script>alert(1)</script>\n\nטקסט");

      expect(html).not.toContain("<script");
      expect(html).not.toContain("alert(1)");
    });

    it("removes javascript: links", () => {
      expect(render("[לחצו](javascript:alert(1))")).not.toContain("javascript:");
    });

    it("removes event handlers from raw image tags", () => {
      expect(render('<img src="x" onerror="alert(1)">')).not.toContain("onerror");
    });

    it("protects outgoing links", () => {
      expect(render("[קישור](https://example.com)")).toContain(
        'rel="noopener noreferrer"',
      );
    });
  });

  describe("structure", () => {
    it("leaves the page's only h1 to the article title", () => {
      const html = render("# כותרת בתוך הכתבה");

      expect(html).not.toContain("<h1");
      expect(html).toContain("<h2>כותרת בתוך הכתבה</h2>");
    });

    it("renders a lone image as a figure outside any paragraph", () => {
      const html = render("![כיתה ז2 בטיול](https://example.com/a.webp)");

      expect(html).toContain("<figure>");
      expect(html).toContain("<figcaption>כיתה ז2 בטיול</figcaption>");
      expect(html).not.toContain("<p>");
    });

    it("gives an image without a caption fallback alt text", () => {
      const html = render("![](https://example.com/a.webp)");

      expect(html).toContain('alt="תמונה בכתבה"');
      expect(html).not.toContain("<figcaption>");
    });

    it("keeps text around an inline image in its paragraph", () => {
      const html = render("לפני ![תמונה](https://example.com/a.webp) אחרי");

      expect(html).toContain("<p>");
    });

    it("makes code blocks left to right", () => {
      expect(render("```\nconst a = 1;\n```")).toContain('<pre dir="ltr">');
    });
  });
});
