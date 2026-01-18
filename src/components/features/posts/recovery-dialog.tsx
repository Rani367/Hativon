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
import { FileText, Trash2 } from "lucide-react";
import type { LocalStorageBackup } from "@/lib/validation/autosave-schemas";

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

/**
 * Truncate text for preview
 */
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

interface RecoveryDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Recovery data from localStorage */
  recoveryData: LocalStorageBackup;
  /** Callback when user chooses to recover */
  onRecover: () => void;
  /** Callback when user chooses to discard */
  onDiscard: () => void;
}

/**
 * Recovery dialog component
 *
 * Shows when localStorage has unsaved changes from a previous session.
 * Allows user to recover or discard the changes.
 */
export function RecoveryDialog({
  open,
  onOpenChange,
  recoveryData,
  onRecover,
  onDiscard,
}: RecoveryDialogProps) {
  const { timestamp, data } = recoveryData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            נמצאו שינויים שלא נשמרו
          </DialogTitle>
          <DialogDescription>
            נמצאה טיוטה שלא נשמרה מ-{formatDateTime(timestamp)}. האם ברצונך לשחזר
            אותה?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/50 p-4 space-y-2 text-sm">
          {data.title && (
            <div>
              <span className="font-medium">כותרת: </span>
              <span className="text-muted-foreground">
                {truncateText(data.title, 50)}
              </span>
            </div>
          )}
          {data.content && (
            <div>
              <span className="font-medium">תוכן: </span>
              <span className="text-muted-foreground">
                {truncateText(data.content)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDiscard}>
            <Trash2 className="h-4 w-4 me-2" />
            בטל
          </Button>
          <Button onClick={onRecover}>
            <FileText className="h-4 w-4 me-2" />
            שחזר
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
