"use client";

import { Button } from "@/components/ui/button";
import { Save, Eye, Loader2 } from "lucide-react";

interface PostFormActionsProps {
  loading: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function PostFormActions({
  loading,
  onCancel,
  onSaveDraft,
  onPublish,
}: PostFormActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-3">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={loading}
        className="w-full sm:w-auto sm:flex-initial"
      >
        ביטול
      </Button>
      <Button
        variant="outline"
        onClick={onSaveDraft}
        disabled={loading}
        className="w-full sm:w-auto sm:flex-initial"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 me-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 me-2" />
        )}
        שמור כטיוטה
      </Button>
      <Button
        onClick={onPublish}
        disabled={loading}
        className="w-full sm:w-auto sm:flex-initial"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 me-2 animate-spin" />
        ) : (
          <Eye className="h-4 w-4 me-2" />
        )}
        פרסם
      </Button>
    </div>
  );
}
