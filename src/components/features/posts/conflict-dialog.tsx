"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Upload, RefreshCw, Edit } from "lucide-react";
import type { ConflictResponse } from "@/lib/validation/autosave-schemas";

/**
 * Format date/time for display in Hebrew
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface ConflictDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Conflict data from server */
  conflictData: ConflictResponse;
  /** Callback when user chooses to overwrite server (keep local changes) */
  onOverwrite: () => void;
  /** Callback when user chooses to reload (use server version) */
  onReload: () => void;
  /** Callback when user chooses to continue editing without saving */
  onContinueEditing: () => void;
}

/**
 * Conflict dialog component
 *
 * Shows when the server version of a post differs from what was loaded.
 * This typically happens when editing on multiple devices simultaneously.
 * Allows user to:
 * - Overwrite server version with local changes
 * - Reload to use server version (discards local changes)
 * - Continue editing without saving
 */
export function ConflictDialog({
  open,
  onOpenChange,
  conflictData,
  onOverwrite,
  onReload,
  onContinueEditing,
}: ConflictDialogProps) {
  const { serverVersion } = conflictData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            הכתבה עודכנה ממקום אחר
          </DialogTitle>
          <DialogDescription>
            הכתבה עודכנה ב-{formatDateTime(serverVersion)} ממכשיר או חלון אחר.
            כיצד תרצה להמשיך?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            onClick={onOverwrite}
          >
            <Upload className="h-4 w-4 me-2 shrink-0" />
            <div className="text-start">
              <div className="font-medium">שמור את השינויים שלי</div>
              <div className="text-xs text-muted-foreground">
                דרוס את הגרסה בשרת עם השינויים המקומיים
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            onClick={onReload}
          >
            <RefreshCw className="h-4 w-4 me-2 shrink-0" />
            <div className="text-start">
              <div className="font-medium">טען את הגרסה מהשרת</div>
              <div className="text-xs text-muted-foreground">
                בטל את השינויים המקומיים והשתמש בגרסה העדכנית
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            onClick={onContinueEditing}
          >
            <Edit className="h-4 w-4 me-2 shrink-0" />
            <div className="text-start">
              <div className="font-medium">המשך לערוך</div>
              <div className="text-xs text-muted-foreground">
                המשך לערוך בלי לשמור עכשיו
              </div>
            </div>
          </Button>
        </div>

        <DialogFooter className="mt-2">
          <p className="text-xs text-muted-foreground">
            השינויים המקומיים שלך נשמרו באופן זמני ולא יאבדו.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
