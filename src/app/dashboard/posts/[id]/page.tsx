"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Post } from "@/types/post.types";
import { logError } from "@/lib/logger";
import { PostFormFields } from "@/components/features/posts/post-form-fields";
import { PostEditActions } from "@/components/features/posts/post-edit-actions";
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
        const response = await fetch(`/api/user/posts/${id}`);
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
          router.push("/dashboard");
        }
      } catch (error) {
        logError("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, router]);

  const handleUpdate = async (status: "draft" | "published") => {
    if (!form.title || !form.content) {
      toast.error("כותרת ותוכן הם שדות חובה");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/user/posts/${id}`, {
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

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      toast.success("הכתבה עודכנה בהצלחה");
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      logError("Failed to update post:", error);
      toast.error("עדכון הכתבה נכשל");
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
      const response = await fetch(`/api/user/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete post");
      }

      toast.success("הכתבה נמחקה בהצלחה");
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      logError("Failed to delete post:", error);
      toast.error(
        `מחיקת הכתבה נכשלה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`,
      );
    }
  };

  const handleTitleChange = (value: string) => {
    setForm({ ...form, title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setForm({ ...form, description: value });
  };

  const handleContentChange = (value: string) => {
    setForm({ ...form, content: value });
  };

  const handleCoverImageChange = (url: string) => {
    setForm({ ...form, coverImage: url });
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
          <PostFormFields
            title={form.title}
            description={form.description}
            content={form.content}
            coverImage={form.coverImage}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onContentChange={handleContentChange}
            onCoverImageChange={handleCoverImageChange}
            showImageUrlInput={true}
          />
        </CardContent>
      </Card>

      <PostEditActions
        loading={saving}
        onCancel={() => router.back()}
        onSaveDraft={() => handleUpdate("draft")}
        onUpdate={() => handleUpdate("published")}
        isPublished={form.status === "published"}
      />
    </div>
  );
}
