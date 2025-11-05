"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, Trash2 } from "lucide-react";
import { Post } from "@/types/post.types";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    coverImage: "",
    author: "",
    category: "",
    tags: "",
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
            author: data.author || "",
            category: data.category || "",
            tags: (data.tags || []).join(", "),
            status: data.status,
          });
        } else {
          alert("הכתבה לא נמצאה");
          router.push("/admin/posts");
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, router]);

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
          ...form,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
          status,
        }),
      });

      if (response.ok) {
        router.push("/admin/posts");
      } else {
        alert("עדכון הכתבה נכשל");
      }
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("עדכון הכתבה נכשל");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הכתבה הזו? פעולה זו לא ניתנת לביטול.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/posts");
      } else {
        alert("מחיקת הכתבה נכשלה");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("מחיקת הכתבה נכשלה");
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
          <p className="text-muted-foreground mt-1">
            עדכן את הכתבה שלך
          </p>
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
            <Label htmlFor="content">תוכן * (Markdown)</Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="כתוב את תוכן הכתבה בפורמט Markdown..."
              className="min-h-[400px] font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coverImage">כתובת תמונת שער</Label>
              <Input
                id="coverImage"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">כותב</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="שם הכותב"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">קטגוריה</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="למשל: ספורט, תרבות"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">תגיות (מופרדות בפסיקים)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="למשל: כדורסל, משחק, תחרות"
              />
            </div>
          </div>

          {form.tags && (
            <div className="flex flex-wrap gap-2">
              {form.tags.split(",").map((tag) => (
                <Badge key={tag.trim()} variant="outline">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          )}
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
