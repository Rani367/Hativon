"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Post } from "@/types/post.types";
import { logError } from "@/lib/logger";
import { PostFormFields } from "@/components/features/posts/post-form-fields";
import { PostEditActions } from "@/components/features/posts/post-edit-actions";
import { AutoSaveIndicator } from "@/components/features/posts/auto-save-indicator";
import { RecoveryDialog } from "@/components/features/posts/recovery-dialog";
import { ConflictDialog } from "@/components/features/posts/conflict-dialog";
import { useAutoSave } from "@/hooks/use-auto-save";
import { toast } from "sonner";
import type { PostFormData } from "@/lib/validation/autosave-schemas";
import { getAutoSaveStorageKey } from "@/lib/validation/autosave-schemas";

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
  const [initialVersion, setInitialVersion] = useState<string | undefined>();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    coverImage: "",
    customAuthor: "",
    status: "draft" as "draft" | "published",
  });

  // Auto-save hook
  const {
    status: autoSaveStatus,
    lastSaved,
    errorMessage,
    recoveryData,
    conflictData,
    updateFormData,
    triggerSave,
    recoverFromLocal,
    clearRecovery,
    dismissConflict,
    cancelPendingSave,
  } = useAutoSave({
    postId: id,
    initialVersion,
    enabled: !loading && !!post,
    onConflict: () => {
      setShowConflictDialog(true);
    },
  });

  // Show recovery dialog when recovery data is available
  useEffect(() => {
    if (recoveryData && !loading) {
      setShowRecoveryDialog(true);
    }
  }, [recoveryData, loading]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPost() {
      try {
        const response = await fetch(`/api/user/posts/${id}`);
        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setPost(data);
          setInitialVersion(data.updatedAt);
          setForm({
            title: data.title,
            description: data.description || "",
            content: data.content,
            coverImage: data.coverImage || "",
            customAuthor: data.author || "",
            status: data.status,
          });
        } else {
          toast.error("הכתבה לא נמצאה");
          router.push("/dashboard");
        }
      } catch (error) {
        if (isMounted) {
          logError("Failed to fetch post:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPost();

    return () => {
      isMounted = false;
    };
  }, [id, router]);

  // Trigger auto-save when form changes
  const triggerAutoSave = useCallback(
    (formData: typeof form) => {
      if (formData.title || formData.content) {
        const autoSaveData: PostFormData = {
          title: formData.title,
          content: formData.content,
          description: formData.description || undefined,
          coverImage: formData.coverImage || undefined,
          customAuthor: formData.customAuthor || undefined,
        };
        updateFormData(autoSaveData);
      }
    },
    [updateFormData],
  );

  // Handle recovery
  const handleRecover = useCallback(() => {
    const recovered = recoverFromLocal();
    if (recovered) {
      setForm((prev) => ({
        ...prev,
        title: recovered.title || prev.title,
        description: recovered.description || prev.description,
        content: recovered.content || prev.content,
        coverImage: recovered.coverImage || prev.coverImage,
        customAuthor: recovered.customAuthor || prev.customAuthor,
      }));
      toast.success("הטיוטה שוחזרה בהצלחה");
    }
    setShowRecoveryDialog(false);
  }, [recoverFromLocal]);

  // Handle discard recovery
  const handleDiscardRecovery = useCallback(() => {
    clearRecovery();
    setShowRecoveryDialog(false);
  }, [clearRecovery]);

  // Handle retry auto-save
  const handleRetryAutoSave = useCallback(() => {
    const autoSaveData: PostFormData = {
      title: form.title,
      content: form.content,
      description: form.description || undefined,
      coverImage: form.coverImage || undefined,
      customAuthor: form.customAuthor || undefined,
    };
    triggerSave(autoSaveData);
  }, [form, triggerSave]);

  // Handle conflict - overwrite server
  const handleConflictOverwrite = useCallback(() => {
    setShowConflictDialog(false);
    dismissConflict();
    // Update the expected version to current server version to force overwrite
    if (conflictData) {
      setInitialVersion(conflictData.serverVersion);
    }
    // Trigger a save with updated version
    handleRetryAutoSave();
  }, [dismissConflict, conflictData, handleRetryAutoSave]);

  // Handle conflict - reload from server
  const handleConflictReload = useCallback(async () => {
    setShowConflictDialog(false);
    dismissConflict();

    // Fetch fresh data from server
    try {
      const response = await fetch(`/api/user/posts/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data);
        setInitialVersion(data.updatedAt);
        setForm({
          title: data.title,
          description: data.description || "",
          content: data.content,
          coverImage: data.coverImage || "",
          customAuthor: data.author || "",
          status: data.status,
        });
        // Clear localStorage backup
        if (typeof window !== "undefined") {
          localStorage.removeItem(getAutoSaveStorageKey(id));
        }
        toast.success("הכתבה נטענה מחדש מהשרת");
      }
    } catch (error) {
      logError("Failed to reload post:", error);
      toast.error("טעינת הכתבה נכשלה");
    }
  }, [id, dismissConflict]);

  // Handle conflict - continue editing
  const handleConflictContinue = useCallback(() => {
    setShowConflictDialog(false);
    dismissConflict();
  }, [dismissConflict]);

  const handleUpdate = async (status: "draft" | "published") => {
    if (!form.title || !form.content) {
      toast.error("כותרת ותוכן הם שדות חובה");
      return;
    }

    // Cancel any pending auto-save
    cancelPendingSave();

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
          author: form.customAuthor || undefined,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      // Clear localStorage backup on successful submit
      if (typeof window !== "undefined") {
        localStorage.removeItem(getAutoSaveStorageKey(id));
      }

      // Success - redirect is the confirmation (no toast needed)
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

    // Cancel any pending auto-save
    cancelPendingSave();

    try {
      const response = await fetch(`/api/user/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete post");
      }

      // Clear localStorage backup on delete
      if (typeof window !== "undefined") {
        localStorage.removeItem(getAutoSaveStorageKey(id));
      }

      // Success - redirect is the confirmation (no toast needed)
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      logError("Failed to delete post:", error);
      toast.error("מחיקת הכתבה נכשלה");
    }
  };

  const handleTitleChange = (value: string) => {
    const newForm = { ...form, title: value };
    setForm(newForm);
    triggerAutoSave(newForm);
  };

  const handleDescriptionChange = (value: string) => {
    const newForm = { ...form, description: value };
    setForm(newForm);
    triggerAutoSave(newForm);
  };

  const handleContentChange = (value: string) => {
    const newForm = { ...form, content: value };
    setForm(newForm);
    triggerAutoSave(newForm);
  };

  const handleCoverImageChange = (url: string) => {
    const newForm = { ...form, coverImage: url };
    setForm(newForm);
    triggerAutoSave(newForm);
  };

  const handleCustomAuthorChange = (value: string) => {
    const newForm = { ...form, customAuthor: value };
    setForm(newForm);
    triggerAutoSave(newForm);
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (!post) {
    return <div className="text-center py-8">הכתבה לא נמצאה</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">ערוך כתבה</h1>
          <p className="text-muted-foreground mt-1">עדכן את הכתבה שלך</p>
        </div>
        <div className="flex items-center gap-3">
          <AutoSaveIndicator
            status={autoSaveStatus}
            lastSaved={lastSaved}
            errorMessage={errorMessage}
            onRetry={handleRetryAutoSave}
          />
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 me-2" />
            מחק
          </Button>
        </div>
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
            customAuthor={form.customAuthor}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onContentChange={handleContentChange}
            onCoverImageChange={handleCoverImageChange}
            onCustomAuthorChange={handleCustomAuthorChange}
            showImageUrlInput={true}
            showCustomAuthor={true}
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

      {/* Recovery Dialog */}
      {recoveryData && (
        <RecoveryDialog
          open={showRecoveryDialog}
          onOpenChange={setShowRecoveryDialog}
          recoveryData={recoveryData}
          onRecover={handleRecover}
          onDiscard={handleDiscardRecovery}
        />
      )}

      {/* Conflict Dialog */}
      {conflictData && (
        <ConflictDialog
          open={showConflictDialog}
          onOpenChange={setShowConflictDialog}
          conflictData={conflictData}
          onOverwrite={handleConflictOverwrite}
          onReload={handleConflictReload}
          onContinueEditing={handleConflictContinue}
        />
      )}
    </div>
  );
}
