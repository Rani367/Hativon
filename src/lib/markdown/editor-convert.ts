import { Marked } from "marked";
import TurndownService from "turndown";

/**
 * Posts are stored as Markdown and edited as HTML, so these run on every load
 * and every keystroke. Anything lost here is lost from the article on save, which
 * is how the old editor destroyed images, tables and strikethrough.
 */

// Marks an empty paragraph, because Markdown collapses runs of blank lines. A
// paragraph holding a non-breaking space round-trips and renders as a blank line.
const BLANK_LINE = "\n\n&nbsp;\n\n";

const parser = new Marked({
  gfm: true,
  // Off so opening an old article can't turn its single newlines into hard breaks
  // and reflow it. The public page doesn't break on them either.
  breaks: false,
  renderer: {
    // Raw HTML in old articles isn't shown to readers, so the editor mustn't
    // bring it back to life on the next save.
    html: () => "",
  },
});

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
  // Empty paragraphs reach here rather than the rules below.
  blankReplacement: (_content, node) =>
    (node as { isBlock?: boolean }).isBlock ? BLANK_LINE : "",
});

turndown.addRule("codeBlock", {
  filter: (node) =>
    node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE",
  replacement: (content, node) => {
    const code = (node as HTMLElement).querySelector("code");
    const language = code?.className?.match(/language-(\w+)/)?.[1] ?? "";
    return `\n\`\`\`${language}\n${code?.textContent ?? content}\n\`\`\`\n`;
  },
});

turndown.addRule("blockquote", {
  filter: "blockquote",
  replacement: (content) =>
    `\n${content
      .trim()
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n")}\n`,
});

turndown.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

function tableCell(cell: Element): string {
  return turndown
    .turndown(cell.innerHTML)
    .replace(/\s*\n\s*/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

turndown.addRule("table", {
  filter: "table",
  replacement: (_content, node) => {
    const rows = Array.from((node as HTMLElement).querySelectorAll("tr")).map(
      (row) => Array.from(row.querySelectorAll("th, td")).map(tableCell),
    );
    if (rows.length === 0) return "";

    const [header, ...body] = rows;
    const line = (cells: string[]) => `| ${cells.join(" | ")} |`;

    return `\n\n${[
      line(header),
      line(header.map(() => "---")),
      ...body.map(line),
    ].join("\n")}\n\n`;
  },
});

export function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") return "";
  return turndown.turndown(html).trim();
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  return parser.parse(markdown, { async: false }) as string;
}
