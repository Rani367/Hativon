"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Eye, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logError } from '@/lib/logger';
import { Input } from "@/components/ui/input";

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    coverImage: "",
    status: "draft" as "draft" | "published",
  });
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    content?: string;
    coverImage?: string;
  }>({});

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
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
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setForm({ ...form, coverImage: data.url });
        if (errors.coverImage) setErrors({ ...errors, coverImage: undefined });
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

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.title || form.title.trim() === "") {
      newErrors.title = "נא להזין כותרת לפוסט";
    } else if (form.title.trim().length < 3) {
      newErrors.title = "הכותרת חייבת להכיל לפחות 3 תווים";
    }

    if (!form.content || form.content.trim() === "") {
      newErrors.content = "נא להזין תוכן לפוסט";
    } else if (form.content.trim().length < 10) {
      newErrors.content = "התוכן חייב להכיל לפחות 10 תווים";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!validateForm()) {
      toast.error("נא למלא את כל השדות הנדרשים");
      return;
    }

    setLoading(true);

    const loadingToast = toast.loading(
      status === "published" ? "מפרסם פוסט..." : "שומר טיוטה..."
    );

    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          content: form.content,
          coverImage: form.coverImage || undefined,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      toast.dismiss(loadingToast);
      toast.success(
        status === "published" ? "הפוסט פורסם בהצלחה!" : "הטיוטה נשמרה בהצלחה!"
      );

      // Refresh to invalidate cache and navigate
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      logError("Failed to create post:", error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : "יצירת הפוסט נכשלה");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">צור פוסט חדש</h1>
        <p className="text-muted-foreground mt-1">
          כתוב פוסט חדש לבלוג
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי הפוסט</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="הזן כותרת פוסט"
              required
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור (אופציונלי)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              placeholder="תיאור קצר של הפוסט שיוצג בקרוסלה וברשימת הפוסטים. אם לא יוזן, התיאור ייווצר אוטומטית מהתוכן."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              התיאור יוצג בקרוסלה ובכרטיסי הפוסטים. מומלץ עד 200 תווים.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">תוכן * (Markdown)</Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => {
                setForm({ ...form, content: e.target.value });
                if (errors.content) setErrors({ ...errors, content: undefined });
              }}
              placeholder="כתוב את תוכן הפוסט בפורמט Markdown..."
              className={`min-h-[250px] sm:min-h-[400px] font-mono ${errors.content ? "border-destructive" : ""}`}
              required
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>תמונת שער (אופציונלי)</Label>
            <p className="text-xs text-muted-foreground">
              פוסטים עם תמונת שער יופיעו בקרוסלה בעמוד הראשי.
            </p>
            {form.coverImage ? (
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={form.coverImage}
                    alt="תצוגה מקדימה"
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2"
                    onClick={() => setForm({ ...form, coverImage: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('imageUpload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 me-2" />
                  {uploading ? "מעלה..." : "העלה תמונה"}
                </Button>
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1 sm:flex-initial"
        >
          ביטול
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={loading}
          className="flex-1 sm:flex-initial"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 me-2" />
          )}
          שמור כטיוטה
        </Button>
        <Button
          onClick={() => handleSubmit("published")}
          disabled={loading}
          className="flex-1 sm:flex-initial"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <Eye className="h-4 w-4 me-2" />
          )}
          פרסם
        </Button>
      </div>
    </div>
  );
}
