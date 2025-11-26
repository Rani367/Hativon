"use client";

import { Button } from "@/components/ui/button";
import { Save, Eye } from "lucide-react";

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
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={onCancel} disabled={loading}>
        ביטול
      </Button>
      <Button variant="outline" onClick={onSaveDraft} disabled={loading}>
        <Save className="h-4 w-4 me-2" />
        שמור כטיוטה
      </Button>
      <Button onClick={onUpdate} disabled={loading}>
        <Eye className="h-4 w-4 me-2" />
        {isPublished ? "עדכן" : "פרסם"}
      </Button>
    </div>
  );
}
