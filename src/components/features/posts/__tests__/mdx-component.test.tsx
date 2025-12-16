import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { components } from "../mdx-component";

// Mock shiki/bundle/web
vi.mock("shiki/bundle/web", () => ({
  codeToHtml: vi.fn().mockResolvedValue(
    '<pre class="shiki"><code>const x = 1;</code></pre>'
  ),
}));

describe("MDX Components", () => {
  describe("Heading Components", () => {
    it("renders h1 with correct styles", () => {
      const H1 = components.h1;
      render(<H1>Test Heading</H1>);
      const heading = screen.getByText("Test Heading");
      expect(heading.tagName).toBe("H1");
      expect(heading.className).toContain("font-bold");
      expect(heading.className).toContain("text-4xl");
    });

    it("renders h2 with correct styles", () => {
      const H2 = components.h2;
      render(<H2>Subheading</H2>);
      const heading = screen.getByText("Subheading");
      expect(heading.tagName).toBe("H2");
      expect(heading.className).toContain("text-2xl");
    });

    it("renders h3 through h6 correctly", () => {
      const H3 = components.h3;
      const H4 = components.h4;
      const H5 = components.h5;
      const H6 = components.h6;

      render(<H3>H3</H3>);
      render(<H4>H4</H4>);
      render(<H5>H5</H5>);
      render(<H6>H6</H6>);

      expect(screen.getByText("H3").tagName).toBe("H3");
      expect(screen.getByText("H4").tagName).toBe("H4");
      expect(screen.getByText("H5").tagName).toBe("H5");
      expect(screen.getByText("H6").tagName).toBe("H6");
    });
  });

  describe("Text Components", () => {
    it("renders paragraph with margin", () => {
      const P = components.p;
      render(<P>Test paragraph</P>);
      const para = screen.getByText("Test paragraph");
      expect(para.tagName).toBe("P");
      expect(para.className).toContain("mb-4");
    });

    it("renders link with href and styles", () => {
      const A = components.a;
      render(<A href="https://example.com">Click here</A>);
      const link = screen.getByText("Click here");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link.className).toContain("text-blue-500");
    });

    it("renders blockquote with border and italic", () => {
      const Blockquote = components.blockquote;
      render(<Blockquote>Quote text</Blockquote>);
      const quote = screen.getByText("Quote text");
      expect(quote.tagName).toBe("BLOCKQUOTE");
      expect(quote.className).toContain("italic");
      expect(quote.className).toContain("border-s-2");
    });
  });

  describe("List Components", () => {
    it("renders unordered list with disc style", () => {
      const Ul = components.ul;
      render(<Ul>List items</Ul>);
      const list = screen.getByText("List items");
      expect(list.tagName).toBe("UL");
      expect(list.className).toContain("list-disc");
    });

    it("renders ordered list with decimal style", () => {
      const Ol = components.ol;
      render(<Ol>Ordered items</Ol>);
      const list = screen.getByText("Ordered items");
      expect(list.tagName).toBe("OL");
      expect(list.className).toContain("list-decimal");
    });

    it("renders list item with margin", () => {
      const Li = components.li;
      render(<Li>Item</Li>);
      const item = screen.getByText("Item");
      expect(item.tagName).toBe("LI");
      expect(item.className).toContain("mb-2");
    });
  });

  describe("Code Components", () => {
    it("renders inline code with Badge", () => {
      const Code = components.code;
      render(<Code>inline code</Code>);
      const code = screen.getByText("inline code");
      expect(code.className).toContain("font-mono");
    });

    it("renders code block with language class", async () => {
      const Code = components.code;
      render(<Code className="language-javascript">const x = 1;</Code>);

      // Should show loading skeleton first, then highlighted code
      await waitFor(() => {
        const codeBlock = document.querySelector(".shiki");
        expect(codeBlock).toBeTruthy();
      });
    });

    it("renders pre with transparent background", () => {
      const Pre = components.pre;
      render(<Pre>Code content</Pre>);
      const pre = screen.getByText("Code content");
      expect(pre.tagName).toBe("PRE");
      expect(pre.className).toContain("bg-transparent");
    });
  });

  describe("Table Components", () => {
    it("renders table structure correctly", () => {
      const TableComp = components.table;
      const Thead = components.thead;
      const Tbody = components.tbody;
      const Tr = components.tr;
      const Th = components.th;
      const Td = components.td;

      render(
        <TableComp>
          <Thead>
            <Tr>
              <Th>Header</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>Cell</Td>
            </Tr>
          </Tbody>
        </TableComp>
      );

      expect(screen.getByText("Header")).toBeInTheDocument();
      expect(screen.getByText("Cell")).toBeInTheDocument();
    });
  });
});

describe("Language Normalization", () => {
  it("handles common language aliases in code blocks", async () => {
    const Code = components.code;

    // Test with 'js' alias
    const { container } = render(
      <Code className="language-js">console.log("test");</Code>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector(".shiki");
      expect(codeBlock).toBeTruthy();
    });
  });
});
