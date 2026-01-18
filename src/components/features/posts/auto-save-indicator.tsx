"use client";

import { cn } from "@/lib/utils";
import { Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import type { AutoSaveStatus } from "@/lib/validation/autosave-schemas";

/**
 * Format time as HH:MM in Hebrew locale
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AutoSaveIndicatorProps {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Last successful save timestamp */
  lastSaved: Date | null;
  /** Error message if status is 'error' */
  errorMessage?: string | null;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Auto-save status indicator component
 *
 * Shows the current save status with appropriate icon and text:
 * - idle: No indicator shown
 * - saving: Loading spinner with "Saving..."
 * - saved: Checkmark with timestamp
 * - error: Warning icon with retry option
 * - conflict: Alert icon with conflict message
 */
export function AutoSaveIndicator({
  status,
  lastSaved,
  errorMessage,
  onRetry,
  className,
}: AutoSaveIndicatorProps) {
  // Don't show anything when idle with no previous save
  if (status === "idle" && !lastSaved) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-opacity duration-200",
        className,
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">שומר...</span>
        </>
      )}

      {status === "saved" && lastSaved && (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-muted-foreground">
            נשמר ב-{formatTime(lastSaved)}
          </span>
        </>
      )}

      {status === "idle" && lastSaved && (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-muted-foreground">
            נשמר ב-{formatTime(lastSaved)}
          </span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">השמירה נכשלה</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              <span>נסה שוב</span>
            </button>
          )}
        </>
      )}

      {status === "conflict" && (
        <>
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-amber-600">הכתבה עודכנה ממקום אחר</span>
        </>
      )}
    </div>
  );
}
