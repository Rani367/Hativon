/**
 * Markdown <-> HTML conversion for the Tiptap editor.
 *
 * Posts are stored as Markdown but edited as HTML inside Tiptap, so content is
 * converted in both directions on every change. These helpers are intentionally
 * free of React/Tiptap dependencies so they can be unit-tested in isolation.
 */

import TurndownService from "turndown";
import { marked } from "marked";

// Marker used to preserve intentional blank lines. Markdown collapses runs of
// blank lines, so an empty paragraph is represented as a paragraph containing a
// non-breaking space, which round-trips and renders as a real blank line.
const BLANK_LINE = "\n\n&nbsp;\n\n";

// Configure marked for consistent HTML output
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

// Configure Turndown for markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
  // Preserve intentional blank lines: empty block nodes (e.g. <p></p> from
  // pressing Enter on an empty line) would otherwise collapse away. Turndown
  // routes "blank" nodes here before consulting rules, so this is the only hook
  // that can capture an empty paragraph.
  blankReplacement: (_content, node) =>
    (node as { isBlock?: boolean }).isBlock ? BLANK_LINE : "",
});

// Custom rule for code blocks
turndownService.addRule("codeBlock", {
  filter: (node) => {
    return node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE";
  },
  replacement: (content, node) => {
    const codeNode = (node as HTMLElement).querySelector("code");
    const language = codeNode?.className?.match(/language-(\w+)/)?.[1] || "";
    const code = codeNode?.textContent || content;
    return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
  },
});

// Custom rule for blockquotes to handle RTL properly
turndownService.addRule("blockquote", {
  filter: "blockquote",
  replacement: (content) => {
    const lines = content.trim().split("\n");
    return "\n" + lines.map((line) => `> ${line}`).join("\n") + "\n";
  },
});

/**
 * Converts HTML from the editor to Markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") {
    return "";
  }
  return turndownService.turndown(html).trim();
}

/**
 * Converts Markdown to HTML for the editor
 * Tiptap expects HTML content, not raw markdown
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) {
    return "";
  }
  // marked.parse returns string when async is false (default)
  return marked.parse(markdown, { async: false }) as string;
}
