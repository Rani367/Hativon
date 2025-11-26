"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import { PostPreview } from "@/components/features/posts/post-preview";
import { PostFormFields } from "@/components/features/posts/post-form-fields";
import { PostFormActions } from "@/components/features/posts/post-form-actions";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { User } from "@/types/user.types";

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
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

  // Debounced values for preview
  const debouncedTitle = useDebouncedValue(form.title, 300);
  const debouncedDescription = useDebouncedValue(form.description, 300);
  const debouncedContent = useDebouncedValue(form.content, 500);
  const debouncedCoverImage = useDebouncedValue(form.coverImage, 300);

  // Fetch current user for preview
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logError("Failed to fetch user:", error);
      }
    }
    fetchUser();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.title || form.title.trim() === "") {
      newErrors.title = "נא להזין כותרת לכתבה";
    } else if (form.title.trim().length < 3) {
      newErrors.title = "הכותרת חייבת להכיל לפחות 3 תווים";
    }

    if (!form.content || form.content.trim() === "") {
      newErrors.content = "נא להזין תוכן לכתבה";
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
      status === "published" ? "מפרסם כתבה..." : "שומר טיוטה...",
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
        status === "published"
          ? "הכתבה פורסמה בהצלחה!"
          : "הטיוטה נשמרה בהצלחה!",
      );

      // Refresh to invalidate cache and navigate
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      logError("Failed to create post:", error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : "יצירת הכתבה נכשלה");
      setLoading(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setForm({ ...form, title: value });
    if (errors.title) setErrors({ ...errors, title: undefined });
  };

  const handleDescriptionChange = (value: string) => {
    setForm({ ...form, description: value });
    if (errors.description) setErrors({ ...errors, description: undefined });
  };

  const handleContentChange = (value: string) => {
    setForm({ ...form, content: value });
    if (errors.content) setErrors({ ...errors, content: undefined });
  };

  const handleCoverImageChange = (url: string) => {
    setForm({ ...form, coverImage: url });
    if (errors.coverImage) setErrors({ ...errors, coverImage: undefined });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">צור כתבה חדשה</h1>
        <p className="text-muted-foreground mt-1">כתוב כתבה חדשה לבלוג</p>
      </div>

      {/* Mobile: Tabs, Desktop: Side-by-side */}
      <Tabs defaultValue="edit" className="lg:hidden">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">
            <Edit className="h-4 w-4 me-2" />
            עריכה
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 me-2" />
            תצוגה מקדימה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
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
                errors={errors}
              />
            </CardContent>
          </Card>

          <PostFormActions
            loading={loading}
            onCancel={() => router.back()}
            onSaveDraft={() => handleSubmit("draft")}
            onPublish={() => handleSubmit("published")}
          />
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-6">
              <PostPreview
                title={debouncedTitle}
                content={debouncedContent}
                coverImage={debouncedCoverImage}
                description={debouncedDescription}
                author={user?.displayName}
                authorGrade={user?.grade}
                authorClass={user?.classNumber}
                date={new Date()}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="space-y-6">
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
                errors={errors}
                idPrefix="desktop"
              />
            </CardContent>
          </Card>

          <PostFormActions
            loading={loading}
            onCancel={() => router.back()}
            onSaveDraft={() => handleSubmit("draft")}
            onPublish={() => handleSubmit("published")}
          />
        </div>

        <div className="sticky top-20 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>תצוגה מקדימה</CardTitle>
            </CardHeader>
            <CardContent>
              <PostPreview
                title={debouncedTitle}
                content={debouncedContent}
                coverImage={debouncedCoverImage}
                description={debouncedDescription}
                author={user?.displayName}
                authorGrade={user?.grade}
                authorClass={user?.classNumber}
                date={new Date()}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
