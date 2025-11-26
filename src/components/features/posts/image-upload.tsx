"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  id?: string;
  showUrlInput?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label = "תמונת שער (אופציונלי)",
  description = "כתבות עם תמונת שער יופיעו בקרוסלה בעמוד הראשי.",
  id = "imageUpload",
  showUrlInput = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onChange(data.url);
        toast.success("התמונה הועלתה בהצלחה");
      } else {
        toast.error("העלאת התמונה נכשלה");
      }
    } catch (error) {
      logError("Failed to upload image:", error);
      toast.error("העלאת התמונה נכשלה");
    } finally {
      setUploading(false);
      // Reset the input to allow uploading the same file again
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      {value ? (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border">
            <img
              src={value}
              alt="תצוגה מקדימה"
              className="w-full h-40 sm:h-48 object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 left-2"
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
              className="text-sm"
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
            />
          )}
        </div>
      )}
    </div>
  );
}
