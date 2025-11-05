"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Eye } from "lucide-react";

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    coverImage: "",
    author: "",
    category: "",
    tags: "",
    status: "draft" as "draft" | "published",
  });

  const handleSubmit = async (status: "draft" | "published") => {
    if (!form.title || !form.content) {
      alert("כותרת ותוכן הם שדות חובה");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
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
        alert("יצירת הכתבה נכשלה");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("יצירת הכתבה נכשלה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">צור כתבה חדשה</h1>
        <p className="text-muted-foreground mt-1">
          כתוב כתבה חדשה לעיתון
        </p>
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
          disabled={loading}
        >
          ביטול
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={loading}
        >
          <Save className="h-4 w-4 me-2" />
          שמור כטיוטה
        </Button>
        <Button
          onClick={() => handleSubmit("published")}
          disabled={loading}
        >
          <Eye className="h-4 w-4 me-2" />
          פרסם
        </Button>
      </div>
    </div>
  );
}
