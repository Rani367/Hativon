"use client";

/**
 * Custom hook for managing the Tiptap editor instance
 * Handles markdown conversion and content synchronization
 */

import { useEditor as useTiptapEditor, Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef } from "react";
import TurndownService from "turndown";
import { createExtensions, editorProps } from "../extensions";

// Configure Turndown for markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
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

interface UseEditorOptions {
  initialContent: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

/**
 * Converts HTML from the editor to Markdown
 */
function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") {
    return "";
  }
  return turndownService.turndown(html).trim();
}

/**
 * Custom hook that wraps Tiptap's useEditor with markdown conversion
 */
export function useEditor({
  initialContent,
  onChange,
  placeholder,
}: UseEditorOptions): Editor | null {
  const isUpdatingFromProps = useRef(false);
  const lastMarkdown = useRef(initialContent);

  const editor = useTiptapEditor({
    extensions: createExtensions(placeholder),
    editorProps,
    content: initialContent,
    immediatelyRender: false, // Prevent SSR hydration issues
    onUpdate: ({ editor }) => {
      // Skip if we're updating from props
      if (isUpdatingFromProps.current) {
        return;
      }

      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);

      // Only trigger onChange if content actually changed
      if (markdown !== lastMarkdown.current) {
        lastMarkdown.current = markdown;
        onChange(markdown);
      }
    },
  });

  // Sync external content changes to editor
  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    // Only update if content differs from what we last sent
    if (initialContent !== lastMarkdown.current) {
      isUpdatingFromProps.current = true;
      lastMarkdown.current = initialContent;

      // Set content without triggering onUpdate
      editor.commands.setContent(initialContent, { emitUpdate: false });

      // Reset flag after a tick
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 0);
    }
  }, [editor, initialContent]);

  return editor;
}

/**
 * Hook to get the current editor state for toolbar buttons
 */
export function useEditorState(editor: Editor | null) {
  const isActive = useCallback(
    (type: string, attrs?: Record<string, unknown>) => {
      if (!editor) return false;
      return editor.isActive(type, attrs);
    },
    [editor],
  );

  const canUndo = editor?.can().undo() ?? false;
  const canRedo = editor?.can().redo() ?? false;

  return {
    isActive,
    canUndo,
    canRedo,
    isBold: isActive("bold"),
    isItalic: isActive("italic"),
    isStrike: isActive("strike"),
    isCode: isActive("code"),
    isBlockquote: isActive("blockquote"),
    isBulletList: isActive("bulletList"),
    isOrderedList: isActive("orderedList"),
    isLink: isActive("link"),
    isHeading1: isActive("heading", { level: 1 }),
    isHeading2: isActive("heading", { level: 2 }),
    isHeading3: isActive("heading", { level: 3 }),
  };
}
