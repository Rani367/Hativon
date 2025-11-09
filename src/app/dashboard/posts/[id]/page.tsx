"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Eye, Trash2, Upload, X } from "lucide-react";
import { Post } from "@/types/post.types";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [form, setForm] = useState({
    title: "",
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
            content: data.content,
            coverImage: data.coverImage || "",
            status: data.status,
          });
        } else {
          alert("הפוסט לא נמצא");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("נא להעלות קובץ תמונה בלבד");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("גודל התמונה חייב להיות קטן מ-5MB");
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
      } else {
        alert("העלאת התמונה נכשלה");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("העלאת התמונה נכשלה");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (status: "draft" | "published") => {
    if (!form.title || !form.content) {
      alert("כותרת ותוכן הם שדות חובה");
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
          content: form.content,
          coverImage: form.coverImage,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      // Refresh to invalidate cache and navigate
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("עדכון הפוסט נכשל");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הפוסט הזה? פעולה זו לא ניתנת לביטול.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }

      // Refresh to invalidate cache and navigate
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert(`מחיקת הפוסט נכשלה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (!post) {
    return <div className="text-center py-8">הפוסט לא נמצא</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ערוך פוסט</h1>
          <p className="text-muted-foreground mt-1">
            עדכן את הפוסט שלך
          </p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 me-2" />
          מחק
        </Button>
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
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="הזן כותרת פוסט"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">תוכן * (Markdown)</Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="כתוב את תוכן הפוסט בפורמט Markdown..."
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
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
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
                <Input
                  placeholder="או הזן כתובת URL של תמונה"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
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
        <Button
          onClick={() => handleUpdate("published")}
          disabled={saving}
        >
          <Eye className="h-4 w-4 me-2" />
          {form.status === "published" ? "עדכן" : "פרסם"}
        </Button>
      </div>
    </div>
  );
}
