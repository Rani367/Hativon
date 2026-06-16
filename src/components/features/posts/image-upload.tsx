"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import { getPostCardImageUrl } from "@/lib/images/post-images";
import {
  ImageCropDialog,
  type CropRect,
} from "@/components/features/posts/image-crop-dialog";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  /** Called after an upload with whether the file carried AI-provenance metadata. */
  onAiDetected?: (aiGenerated: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
  showUrlInput?: boolean;
  error?: string;
}

export function ImageUpload({
  value,
  onChange,
  onAiDetected,
  label = "תמונת שער *",
  description = "תמונת שער לכתבה.",
  id = "imageUpload",
  showUrlInput = false,
  error,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  // Holds the picked file + its preview object URL while the crop dialog is open.
  const [pending, setPending] = useState<{ file: File; url: string } | null>(
    null,
  );

  // Safety net: revoke the object URL if the component unmounts mid-crop.
  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.url);
    };
  }, [pending]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input now so the same file can be re-selected after cancel/finish.
    e.target.value = "";
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("נא להעלות קובץ תמונה בלבד");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("גודל התמונה חייב להיות קטן מ-5MB");
      return;
    }

    // Open the interactive crop dialog before uploading.
    setPending({ file, url: URL.createObjectURL(file) });
  };

  const uploadFile = async (file: File, crop?: CropRect) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (crop) {
        formData.append("cropX", String(Math.round(crop.x)));
        formData.append("cropY", String(Math.round(crop.y)));
        formData.append("cropWidth", String(Math.round(crop.width)));
        formData.append("cropHeight", String(Math.round(crop.height)));
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onChange(data.url);
        onAiDetected?.(Boolean(data.aiGenerated));
        toast.success("התמונה הועלתה בהצלחה");
      } else {
        toast.error("העלאת התמונה נכשלה");
      }
    } catch (error) {
      logError("Failed to upload image:", error);
      toast.error("העלאת התמונה נכשלה");
    } finally {
      setUploading(false);
    }
  };

  const closePending = () => {
    setPending((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const handleCropConfirm = (crop: CropRect) => {
    const file = pending?.file;
    closePending();
    if (file) void uploadFile(file, crop);
  };

  const handleCropCancel = () => {
    closePending();
  };

  const handleRemoveImage = () => {
    onChange("");
    onAiDetected?.(false);
  };
  const previewImage = getPostCardImageUrl(value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      {value ? (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border h-40 sm:h-48">
            <Image
              src={previewImage || value}
              alt="תצוגה מקדימה"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 start-2"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {showUrlInput && (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="או הזן כתובת URL"
              className="min-h-11 text-sm sm:min-h-9"
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById(id)?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 me-2" />
            )}
            {uploading ? "מעלה..." : "העלה תמונה"}
          </Button>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          {showUrlInput && (
            <Input
              placeholder="או הזן כתובת URL של תמונה"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-11 sm:min-h-9"
            />
          )}
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <ImageCropDialog
          open
          imageSrc={pending.url}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
