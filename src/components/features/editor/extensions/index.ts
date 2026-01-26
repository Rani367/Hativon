/**
 * Tiptap editor extensions configuration
 * Configures all formatting features: headings, bold, italic, lists, links, code, etc.
 */

import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

/**
 * Creates the configured extensions array for the Tiptap editor
 */
export function createExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      // Disable built-in Link - we configure it separately below with custom settings
      link: false,
      // Heading configuration - levels 1-3 only
      heading: {
        levels: [1, 2, 3],
      },
      // Enable all standard formatting
      bold: {},
      italic: {},
      strike: {},
      code: {},
      codeBlock: {
        HTMLAttributes: {
          class: "code-block",
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: "blockquote",
        },
      },
      bulletList: {
        HTMLAttributes: {
          class: "bullet-list",
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: "ordered-list",
        },
      },
      listItem: {},
      horizontalRule: {},
      hardBreak: {},
    }),

    // Link extension with security settings
    Link.configure({
      openOnClick: false, // Don't open links when clicking in editor
      autolink: true, // Auto-detect URLs
      linkOnPaste: true, // Convert pasted URLs to links
      HTMLAttributes: {
        class: "editor-link",
        rel: "noopener noreferrer",
        target: "_blank",
      },
      validate: (href) => /^https?:\/\//.test(href), // Only allow http/https
    }),

    // Placeholder text when editor is empty
    Placeholder.configure({
      placeholder: placeholder || "התחל לכתוב...",
      emptyEditorClass: "is-editor-empty",
    }),
  ];
}

/**
 * Editor props for RTL Hebrew support
 */
export const editorProps = {
  attributes: {
    dir: "rtl",
    lang: "he",
    class: "prose prose-lg max-w-none focus:outline-none min-h-[200px] p-4",
  },
};
