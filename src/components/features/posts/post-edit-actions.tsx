"use client";

import { Button } from "@/components/ui/button";
import { Save, Eye, Loader2 } from "lucide-react";

interface PostEditActionsProps {
  loading: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  onUpdate: () => void;
  isPublished: boolean;
}

export function PostEditActions({
  loading,
  onCancel,
  onSaveDraft,
  onUpdate,
  isPublished,
}: PostEditActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end sm:gap-3">
      <Button variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
        ביטול
      </Button>
      <Button variant="outline" onClick={onSaveDraft} disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <Loader2 className="h-4 w-4 me-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 me-2" />
        )}
        שמור כטיוטה
      </Button>
      <Button onClick={onUpdate} disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <Loader2 className="h-4 w-4 me-2 animate-spin" />
        ) : (
          <Eye className="h-4 w-4 me-2" />
        )}
        {isPublished ? "עדכן" : "פרסם"}
      </Button>
    </div>
  );
}
