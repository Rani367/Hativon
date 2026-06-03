"use client";

import { MAX_POST_DESCRIPTION_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
  /** null = not yet answered, true = AI-generated, false = real photo */
  aiGeneratedImage: boolean | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCoverImageChange: (url: string) => void;
  onCustomAuthorChange?: (value: string) => void;
  onAiGeneratedImageChange: (value: boolean) => void;
  errors?: {
    title?: string;
    description?: string;
    content?: string;
    coverImage?: string;
    aiGeneratedImage?: string;
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
  aiGeneratedImage,
  onTitleChange,
  onDescriptionChange,
  onContentChange,
  onCoverImageChange,
  onCustomAuthorChange,
  onAiGeneratedImageChange,
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
  const aiImageId = idPrefix ? `aiImage-${idPrefix}` : "aiImage";

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
          className={
            errors.title
              ? "min-h-11 border-destructive sm:min-h-9"
              : "min-h-11 sm:min-h-9"
          }
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
        <p className="text-xs text-muted-foreground">
          כותרת טובה עוזרת לתלמידים ולמורים להבין מיד על מה הכתבה.
        </p>
      </div>

      {showCustomAuthor && (
        <div className="space-y-2">
          <Label htmlFor={customAuthorId}>שם מחבר להצגה (אופציונלי)</Label>
          <Input
            id={customAuthorId}
            value={customAuthor}
            onChange={(e) => onCustomAuthorChange?.(e.target.value)}
            placeholder="לדוגמה: מערכת חטיבון או ועדת תרבות"
            className="min-h-11 sm:min-h-9"
          />
          <p className="text-xs text-muted-foreground">
            אם תשאירו ריק, יוצג השם שמוגדר בפרופיל.
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
          maxLength={MAX_POST_DESCRIPTION_LENGTH}
        />
        <p className="text-xs text-muted-foreground">
          התיאור יוצג בכרטיסי הכתבות. עד {MAX_POST_DESCRIPTION_LENGTH} תווים.
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
        <p className="text-xs text-muted-foreground">
          הטיוטה נשמרת אוטומטית בזמן הכתיבה כדי שלא תאבדו עבודה.
        </p>
      </div>

      <ImageUpload
        value={coverImage}
        onChange={onCoverImageChange}
        id={imageUploadId}
        showUrlInput={showImageUrlInput}
        error={errors.coverImage}
      />

      {coverImage && (
        <div className="space-y-2">
          <Label>האם תמונת השער נוצרה באמצעות בינה מלאכותית? *</Label>
          <div
            role="radiogroup"
            aria-invalid={!!errors.aiGeneratedImage}
            aria-describedby={
              errors.aiGeneratedImage ? `${aiImageId}-error` : undefined
            }
            className="flex flex-col gap-2 sm:flex-row sm:gap-3"
          >
            <label
              className={cn(
                "flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors",
                aiGeneratedImage === true
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name={aiImageId}
                value="ai"
                checked={aiGeneratedImage === true}
                onChange={() => onAiGeneratedImageChange(true)}
                className="size-4 accent-primary"
              />
              <span>נוצרה באמצעות AI</span>
            </label>
            <label
              className={cn(
                "flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors",
                aiGeneratedImage === false
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name={aiImageId}
                value="real"
                checked={aiGeneratedImage === false}
                onChange={() => onAiGeneratedImageChange(false)}
                className="size-4 accent-primary"
              />
              <span>צולמה / לא AI</span>
            </label>
          </div>
          {errors.aiGeneratedImage && (
            <p
              id={`${aiImageId}-error`}
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.aiGeneratedImage}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            כתבות שתמונתן נוצרה ב-AI יסומנו בתגית ויוצגו בתחתית הגלריה.
          </p>
        </div>
      )}
    </>
  );
}
