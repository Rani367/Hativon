/**
 * TypeScript types for the Rich Text Editor component
 */

export interface RichTextEditorProps {
  /** Current markdown content */
  value: string;
  /** Callback when content changes - receives markdown string */
  onChange: (markdown: string) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Additional CSS classes for the editor container */
  className?: string;
  /** HTML id attribute for the editor */
  id?: string;
  /** Indicates if the field has validation errors */
  'aria-invalid'?: boolean;
  /** ID of the element describing the error */
  'aria-describedby'?: string;
  /** Minimum height of the editor content area */
  minHeight?: string;
}

export interface ToolbarButtonProps {
  /** Whether the button action is currently active (e.g., text is bold) */
  isActive: boolean;
  /** Click handler for the button */
  onClick: () => void;
  /** Hebrew label for the button */
  label: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Icon component to render */
  icon: React.ReactNode;
}

export interface LinkDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Close the dialog */
  onClose: () => void;
  /** Submit the link URL */
  onSubmit: (url: string) => void;
  /** Current URL value (for editing existing links) */
  initialUrl?: string;
}
