"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Eye, Trash2, Upload, X, Loader2 } from "lucide-react";
import { Post } from "@/types/post.types";
import { logError } from "@/lib/logger";
import { toast } from "sonner";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    coverImage: "",
    status: "draft" as "draft" | "published",
  });

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/admin/posts/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data);
          setForm({
            title: data.title,
            description: data.description || "",
            content: data.content,
            coverImage: data.coverImage || "",
            status: data.status,
          });
        } else {
          toast.error("הכתבה לא נמצאה");
          router.push("/admin/posts");
        }
      } catch (error) {
        logError("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("נא להעלות קובץ תמונה בלבד");
      return;
    }

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
        setForm({ ...form, coverImage: data.url });
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

  const handleUpdate = async (status: "draft" | "published") => {
    if (!form.title || !form.content) {
      toast.error("כותרת ותוכן הם שדות חובה");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          content: form.content,
          coverImage: form.coverImage,
          status,
        }),
      });

      if (response.ok) {
        toast.success("הכתבה עודכנה בהצלחה");
        router.push("/admin/posts");
      } else {
        toast.error("עדכון הכתבה נכשל");
      }
    } catch (error) {
      logError("Failed to update post:", error);
      toast.error("עדכון הכתבה נכשל");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "האם אתה בטוח שברצונך למחוק את הכתבה הזו? פעולה זו לא ניתנת לביטול.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("הכתבה נמחקה בהצלחה");
        router.push("/admin/posts");
      } else {
        toast.error("מחיקת הכתבה נכשלה");
      }
    } catch (error) {
      logError("Failed to delete post:", error);
      toast.error("מחיקת הכתבה נכשלה");
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (!post) {
    return <div className="text-center py-8">הכתבה לא נמצאה</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ערוך כתבה</h1>
          <p className="text-muted-foreground mt-1">עדכן את הכתבה שלך</p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 me-2" />
          מחק
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי הכתבה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="הזן כותרת כתבה"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור (אופציונלי)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="תיאור קצר של הכתבה. אם לא יוזן, התיאור ייווצר אוטומטית מהתוכן."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              התיאור יוצג בכרטיסי הכתבות. מומלץ עד 200 תווים.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">תוכן</Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="כתוב את תוכן הכתבה..."
              className="min-h-[400px] font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>תמונת שער</Label>
            {form.coverImage ? (
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={form.coverImage}
                    alt="תצוגה מקדימה"
                    className="w-full h-48 object-cover"
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
                <Input
                  value={form.coverImage}
                  onChange={(e) =>
                    setForm({ ...form, coverImage: e.target.value })
                  }
                  placeholder="או הזן כתובת URL"
                  className="text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      document.getElementById("imageUpload")?.click()
                    }
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
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <Input
                  placeholder="או הזן כתובת URL של תמונה"
                  value={form.coverImage}
                  onChange={(e) =>
                    setForm({ ...form, coverImage: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          ביטול
        </Button>
        <Button
          variant="outline"
          onClick={() => handleUpdate("draft")}
          disabled={saving}
        >
          <Save className="h-4 w-4 me-2" />
          שמור כטיוטה
        </Button>
        <Button onClick={() => handleUpdate("published")} disabled={saving}>
          <Eye className="h-4 w-4 me-2" />
          {form.status === "published" ? "עדכן" : "פרסם"}
        </Button>
      </div>
    </div>
  );
}
