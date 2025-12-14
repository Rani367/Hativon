"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "./image-upload";
import { LazyRichTextEditor } from "@/components/features/editor";

interface PostFormFieldsProps {
  title: string;
  description: string;
  content: string;
  coverImage: string;
  customAuthor?: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCoverImageChange: (url: string) => void;
  onCustomAuthorChange?: (value: string) => void;
  errors?: {
    title?: string;
    description?: string;
    content?: string;
    coverImage?: string;
  };
  idPrefix?: string;
  showImageUrlInput?: boolean;
  showCustomAuthor?: boolean;
}

export function PostFormFields({
  title,
  description,
  content,
  coverImage,
  customAuthor = "",
  onTitleChange,
  onDescriptionChange,
  onContentChange,
  onCoverImageChange,
  onCustomAuthorChange,
  errors = {},
  idPrefix = "",
  showImageUrlInput = false,
  showCustomAuthor = false,
}: PostFormFieldsProps) {
  const titleId = idPrefix ? `title-${idPrefix}` : "title";
  const descriptionId = idPrefix ? `description-${idPrefix}` : "description";
  const contentId = idPrefix ? `content-${idPrefix}` : "content";
  const imageUploadId = idPrefix ? `imageUpload-${idPrefix}` : "imageUpload";
  const customAuthorId = idPrefix ? `customAuthor-${idPrefix}` : "customAuthor";

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={titleId}>כותרת *</Label>
        <Input
          id={titleId}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="הזן כותרת כתבה"
          required
          className={errors.title ? "border-destructive" : ""}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? `${titleId}-error` : undefined}
        />
        {errors.title && (
          <p
            id={`${titleId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.title}
          </p>
        )}
      </div>

      {showCustomAuthor && (
        <div className="space-y-2">
          <Label htmlFor={customAuthorId}>שם מחבר מותאם (אופציונלי)</Label>
          <Input
            id={customAuthorId}
            value={customAuthor}
            onChange={(e) => onCustomAuthorChange?.(e.target.value)}
            placeholder="השאר ריק לשימוש בשם התצוגה שלך"
          />
          <p className="text-xs text-muted-foreground">
            אם תשאיר ריק, יוצג השם שלך מהפרופיל
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={descriptionId}>תיאור (אופציונלי)</Label>
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="תיאור קצר של הכתבה. אם לא יוזן, התיאור ייווצר אוטומטית מהתוכן."
          className="min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground">
          התיאור יוצג בכרטיסי הכתבות. מומלץ עד 200 תווים.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={contentId}>תוכן</Label>
        <LazyRichTextEditor
          id={contentId}
          value={content}
          onChange={onContentChange}
          placeholder="כתוב את תוכן הכתבה..."
          minHeight="300px"
          aria-invalid={!!errors.content}
          aria-describedby={errors.content ? `${contentId}-error` : undefined}
        />
        {errors.content && (
          <p
            id={`${contentId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.content}
          </p>
        )}
      </div>

      <ImageUpload
        value={coverImage}
        onChange={onCoverImageChange}
        id={imageUploadId}
        showUrlInput={showImageUrlInput}
      />
    </>
  );
}
