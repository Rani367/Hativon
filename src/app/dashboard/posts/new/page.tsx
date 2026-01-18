"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import { PostFormFields } from "@/components/features/posts/post-form-fields";
import { PostFormActions } from "@/components/features/posts/post-form-actions";
import { AutoSaveIndicator } from "@/components/features/posts/auto-save-indicator";
import { RecoveryDialog } from "@/components/features/posts/recovery-dialog";
import { useAutoSave } from "@/hooks/use-auto-save";
import type { User } from "@/types/user.types";
import type { PostFormData } from "@/lib/validation/autosave-schemas";
import {
  getAutoSaveStorageKey,
  AUTOSAVE_STORAGE_KEY_NEW,
  AUTOSAVE_DRAFT_ID_KEY,
} from "@/lib/validation/autosave-schemas";

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingDraft, setCheckingDraft] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    coverImage: "",
    customAuthor: "",
    status: "draft" as "draft" | "published",
  });
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    content?: string;
    coverImage?: string;
  }>({});

  // Auto-save hook
  const {
    status: autoSaveStatus,
    lastSaved,
    errorMessage,
    recoveryData,
    currentPostId,
    updateFormData,
    triggerSave,
    recoverFromLocal,
    clearRecovery,
    cancelPendingSave,
  } = useAutoSave({
    postId: null,
    enabled: true,
    onSaveComplete: (id) => {
      // If auto-save created a new post, we could navigate to edit page
      // but for now we just track the ID silently
      if (id && !currentPostId) {
        // Post was created, user can continue editing
      }
    },
  });

  // Check for existing draft ID on mount and redirect
  useEffect(() => {
    if (typeof window === "undefined") {
      setCheckingDraft(false);
      return;
    }

    const savedDraftId = localStorage.getItem(AUTOSAVE_DRAFT_ID_KEY);
    if (savedDraftId) {
      // Redirect to edit the existing draft
      router.replace(`/dashboard/posts/${savedDraftId}`);
    } else {
      setCheckingDraft(false);
    }
  }, [router]);

  // Show recovery dialog when recovery data is available
  useEffect(() => {
    if (recoveryData && !checkingDraft) {
      setShowRecoveryDialog(true);
    }
  }, [recoveryData, checkingDraft]);

  // Fetch current user for metadata
  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok && isMounted) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        if (isMounted) {
          logError("Failed to fetch user:", error);
        }
      }
    }
    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger auto-save when form changes
  const triggerAutoSave = useCallback(
    (formData: typeof form) => {
      // Only auto-save if there's meaningful content
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
      setForm({
        title: recovered.title || "",
        description: recovered.description || "",
        content: recovered.content || "",
        coverImage: recovered.coverImage || "",
        customAuthor: recovered.customAuthor || "",
        status: "draft",
      });
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

    // Cancel any pending auto-save
    cancelPendingSave();

    setLoading(true);

    try {
      // If auto-save already created a draft, update it instead
      const url = currentPostId
        ? `/api/user/posts/${currentPostId}`
        : "/api/admin/posts";
      const method = currentPostId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          content: form.content,
          coverImage: form.coverImage || undefined,
          author: form.customAuthor || undefined,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      // Clear localStorage backup on successful submit
      if (typeof window !== "undefined") {
        const storageKey = getAutoSaveStorageKey(currentPostId);
        localStorage.removeItem(storageKey);
        // Also clear the "new" key if we had one
        localStorage.removeItem(AUTOSAVE_STORAGE_KEY_NEW);
        // Clear the draft ID so next visit shows empty form
        localStorage.removeItem(AUTOSAVE_DRAFT_ID_KEY);
      }

      // Success - redirect is the confirmation (no toast needed)
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      logError("Failed to create post:", error);
      toast.error(error instanceof Error ? error.message : "יצירת הכתבה נכשלה");
      setLoading(false);
    }
  };

  const handleTitleChange = (value: string) => {
    const newForm = { ...form, title: value };
    setForm(newForm);
    if (errors.title) setErrors({ ...errors, title: undefined });
    triggerAutoSave(newForm);
  };

  const handleDescriptionChange = (value: string) => {
    const newForm = { ...form, description: value };
    setForm(newForm);
    if (errors.description) setErrors({ ...errors, description: undefined });
    triggerAutoSave(newForm);
  };

  const handleContentChange = (value: string) => {
    const newForm = { ...form, content: value };
    setForm(newForm);
    if (errors.content) setErrors({ ...errors, content: undefined });
    triggerAutoSave(newForm);
  };

  const handleCoverImageChange = (url: string) => {
    const newForm = { ...form, coverImage: url };
    setForm(newForm);
    if (errors.coverImage) setErrors({ ...errors, coverImage: undefined });
    triggerAutoSave(newForm);
  };

  const handleCustomAuthorChange = (value: string) => {
    const newForm = { ...form, customAuthor: value };
    setForm(newForm);
    triggerAutoSave(newForm);
  };

  // Show loading while checking for existing draft
  if (checkingDraft) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">צור כתבה חדשה</h1>
          <p className="text-muted-foreground mt-1">כתוב כתבה חדשה לבלוג</p>
        </div>
        <AutoSaveIndicator
          status={autoSaveStatus}
          lastSaved={lastSaved}
          errorMessage={errorMessage}
          onRetry={handleRetryAutoSave}
        />
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
            errors={errors}
            showCustomAuthor={true}
          />
        </CardContent>
      </Card>

      <PostFormActions
        loading={loading}
        onCancel={() => router.back()}
        onSaveDraft={() => handleSubmit("draft")}
        onPublish={() => handleSubmit("published")}
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
    </div>
  );
}
