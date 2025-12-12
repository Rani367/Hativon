'use client';

/**
 * Editor Toolbar Component
 * Provides formatting buttons for the WYSIWYG editor
 */

import { type Editor } from '@tiptap/react';
import { useCallback, useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  Unlink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useEditorState } from './hooks/use-editor';

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-muted text-foreground'
      )}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const state = useEditorState(editor);

  const handleLink = useCallback(() => {
    if (!editor) return;

    if (state.isLink) {
      // Remove existing link
      editor.chain().focus().unsetLink().run();
    } else {
      // Show link input
      setShowLinkInput(true);
      // Pre-fill with current selection's link if any
      const previousUrl = editor.getAttributes('link').href;
      setLinkUrl(previousUrl || '');
    }
  }, [editor, state.isLink]);

  const submitLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl.trim()) {
      // Ensure URL has protocol
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().setLink({ href: url }).run();
    }

    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const cancelLink = useCallback(() => {
    setShowLinkInput(false);
    setLinkUrl('');
    editor?.chain().focus().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border-b bg-muted/30 p-2', className)}>
      {showLinkInput ? (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitLink();
              } else if (e.key === 'Escape') {
                cancelLink();
              }
            }}
          />
          <Button type="button" size="sm" onClick={submitLink} className="h-8">
            הוסף
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={cancelLink} className="h-8">
            ביטול
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!state.canUndo}
            title="בטל (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!state.canRedo}
            title="בצע שוב (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={state.isBold}
            title="מודגש (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={state.isItalic}
            title="נטוי (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={state.isStrike}
            title="קו חוצה"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={state.isCode}
            title="קוד (Ctrl+E)"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={state.isHeading1}
            title="כותרת 1 (Ctrl+Alt+1)"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={state.isHeading2}
            title="כותרת 2 (Ctrl+Alt+2)"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={state.isHeading3}
            title="כותרת 3 (Ctrl+Alt+3)"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={state.isBulletList}
            title="רשימה (Ctrl+Shift+8)"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={state.isOrderedList}
            title="רשימה ממוספרת (Ctrl+Shift+7)"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block elements */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={state.isBlockquote}
            title="ציטוט (Ctrl+Shift+B)"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleLink}
            isActive={state.isLink}
            title={state.isLink ? 'הסר קישור' : 'הוסף קישור (Ctrl+K)'}
          >
            {state.isLink ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}
