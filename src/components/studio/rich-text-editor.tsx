"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Table,
  Undo,
  Unlink,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { prepareImage, uploadImage } from "@/lib/images/prepare-upload";
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdown/editor-convert";
import { studioCopy } from "@/lib/studio-copy";

const { toolbar: text } = studioCopy;

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Uploads a photo into the article, asking for a caption. */
async function insertImage(editor: Editor, file: File) {
  try {
    const prepared = await prepareImage(file);
    const { url, aiGenerated } = await uploadImage(prepared.file, {
      purpose: "inline",
      aiProvenance: prepared.aiProvenance,
    });

    const caption = window.prompt(
      text.captionPrompt,
      aiGenerated ? text.aiCaption : "",
    );
    // Moves past the image, which would otherwise stay selected and be replaced
    // by whatever is typed or inserted next.
    editor
      .chain()
      .focus()
      .setImage({ src: url, alt: caption ?? "" })
      .createParagraphNear()
      .run();
  } catch (error) {
    toast.error((error as Error).message);
  }
}

function imageFrom(files: FileList | undefined | null): File | undefined {
  return [...(files ?? [])].find((file) => file.type.startsWith("image/"));
}

function Toolbar({ editor }: { editor: Editor }) {
  const picker = useRef<HTMLInputElement>(null);
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState("");
  const chain = () => editor.chain().focus();

  function submitLink() {
    const trimmed = url.trim();
    if (trimmed) {
      const href = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
      chain().setLink({ href }).run();
    }
    setLinking(false);
    setUrl("");
  }

  const isLink = editor.isActive("link");

  return (
    <div className="toolbar" role="toolbar">
      <ToolButton label={text.undo} disabled={!editor.can().undo()} onClick={() => chain().undo().run()}>
        <Undo size={18} />
      </ToolButton>
      <ToolButton label={text.redo} disabled={!editor.can().redo()} onClick={() => chain().redo().run()}>
        <Redo size={18} />
      </ToolButton>
      <ToolButton label={text.bold} active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}>
        <Bold size={18} />
      </ToolButton>
      <ToolButton label={text.italic} active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}>
        <Italic size={18} />
      </ToolButton>
      <ToolButton label={text.strike} active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough size={18} />
      </ToolButton>
      <ToolButton label={text.code} active={editor.isActive("code")} onClick={() => chain().toggleCode().run()}>
        <Code size={18} />
      </ToolButton>
      <ToolButton label={text.heading(2)} active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={18} />
      </ToolButton>
      <ToolButton label={text.heading(3)} active={editor.isActive("heading", { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={18} />
      </ToolButton>
      <ToolButton label={text.bullets} active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}>
        <List size={18} />
      </ToolButton>
      <ToolButton label={text.numbers} active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered size={18} />
      </ToolButton>
      <ToolButton label={text.quote} active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()}>
        <Quote size={18} />
      </ToolButton>
      <ToolButton
        label={isLink ? text.unlink : text.link}
        active={isLink}
        onClick={() => (isLink ? chain().unsetLink().run() : setLinking(true))}
      >
        {isLink ? <Unlink size={18} /> : <LinkIcon size={18} />}
      </ToolButton>
      <ToolButton label={text.image} onClick={() => picker.current?.click()}>
        <ImagePlus size={18} />
      </ToolButton>
      <ToolButton
        label={text.table}
        onClick={() => chain().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}
      >
        <Table size={18} />
      </ToolButton>

      <input
        ref={picker}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void insertImage(editor, file);
          event.target.value = "";
        }}
      />

      {linking ? (
        <div className="toolbar-link">
          <input
            autoFocus
            type="url"
            dir="ltr"
            aria-label={text.linkPrompt}
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitLink();
              }
              if (event.key === "Escape") setLinking(false);
            }}
          />
          <button type="button" className="button" onClick={submitLink}>
            {text.add}
          </button>
          <button type="button" className="button button-quiet" onClick={() => setLinking(false)}>
            {text.cancel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder: string;
}

/** Edits HTML, stores Markdown. Styled as the published article will look. */
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const lastMarkdown = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const editor = useEditor({
    immediatelyRender: false,
    content: markdownToHtml(value),
    extensions: [
      StarterKit.configure({ link: false, heading: { levels: [1, 2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ allowBase64: false }),
      TableKit,
    ],
    editorProps: {
      attributes: { dir: "rtl", lang: "he", class: "article-body" },
      handlePaste(_view, event) {
        const file = imageFrom(event.clipboardData?.files);
        if (!file || !editorRef.current) return false;
        void insertImage(editorRef.current, file);
        return true;
      },
      handleDrop(_view, event) {
        const file = imageFrom((event as DragEvent).dataTransfer?.files);
        if (!file || !editorRef.current) return false;
        void insertImage(editorRef.current, file);
        return true;
      },
    },
    onUpdate({ editor: current }) {
      const markdown = htmlToMarkdown(current.getHTML());
      if (markdown !== lastMarkdown.current) {
        lastMarkdown.current = markdown;
        onChangeRef.current(markdown);
      }
    },
  });

  const editorRef = useRef<Editor | null>(null);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Content replaced from outside: recovering a draft or resolving a conflict.
  useEffect(() => {
    if (!editor || editor.isDestroyed || value === lastMarkdown.current) return;

    lastMarkdown.current = value;
    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="editor-body" />;

  return (
    <div>
      <Toolbar editor={editor} />
      <div className="editor-body">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
