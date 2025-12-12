'use client';

/**
 * Rich Text Editor Component
 * A WYSIWYG editor that stores content as Markdown
 * Provides a Google Docs-like editing experience with RTL/Hebrew support
 */

import { EditorContent } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './editor-toolbar';
import { useEditor } from './hooks/use-editor';
import type { RichTextEditorProps } from './types';

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  minHeight = '250px',
}: RichTextEditorProps) {
  const editor = useEditor({
    initialContent: value,
    onChange,
    placeholder,
  });

  return (
    <div
      id={id}
      className={cn(
        'rounded-md border bg-background',
        ariaInvalid && 'border-destructive',
        className
      )}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
    >
      <EditorToolbar editor={editor} />
      <div
        className="rich-text-editor-content"
        style={{ minHeight }}
      >
        <EditorContent
          editor={editor}
          className="h-full"
        />
      </div>
    </div>
  );
}
