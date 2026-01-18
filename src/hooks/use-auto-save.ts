import { useState, useEffect, useRef, useCallback } from "react";
import { logError } from "@/lib/logger";
import type {
  PostFormData,
  AutoSaveStatus,
  LocalStorageBackup,
  ConflictResponse,
} from "@/lib/validation/autosave-schemas";
import {
  getAutoSaveStorageKey,
  localStorageBackupSchema,
} from "@/lib/validation/autosave-schemas";

/**
 * Auto-save debounce delay in milliseconds
 * Saves 2 seconds after user stops typing
 */
const AUTOSAVE_DEBOUNCE_MS = 2000;

/**
 * Configuration options for the auto-save hook
 */
interface UseAutoSaveOptions {
  /** Post ID - null for new posts */
  postId: string | null;
  /** Initial server version timestamp for conflict detection */
  initialVersion?: string;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when save completes successfully */
  onSaveComplete?: (id: string, updatedAt: string) => void;
  /** Callback when conflict is detected */
  onConflict?: (conflict: ConflictResponse) => void;
}

/**
 * Return value from useAutoSave hook
 */
interface UseAutoSaveReturn {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Last successful save timestamp */
  lastSaved: Date | null;
  /** Error message if status is 'error' */
  errorMessage: string | null;
  /** Conflict data if status is 'conflict' */
  conflictData: ConflictResponse | null;
  /** LocalStorage recovery data if available */
  recoveryData: LocalStorageBackup | null;
  /** Post ID (may be updated after first save of new post) */
  currentPostId: string | null;
  /** Trigger an immediate save */
  triggerSave: (data: PostFormData) => void;
  /** Update form data (triggers debounced save) */
  updateFormData: (data: PostFormData) => void;
  /** Recover content from localStorage */
  recoverFromLocal: () => PostFormData | null;
  /** Clear localStorage backup */
  clearRecovery: () => void;
  /** Dismiss conflict and continue editing */
  dismissConflict: () => void;
  /** Cancel any pending save operations */
  cancelPendingSave: () => void;
}

/**
 * Custom hook for auto-saving post content
 *
 * Features:
 * - Debounced saves (2 seconds after last change)
 * - LocalStorage backup for crash recovery
 * - Conflict detection with server version
 * - Status tracking for UI feedback
 */
export function useAutoSave({
  postId,
  initialVersion,
  enabled = true,
  onSaveComplete,
  onConflict,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<ConflictResponse | null>(
    null,
  );
  const [recoveryData, setRecoveryData] = useState<LocalStorageBackup | null>(
    null,
  );
  const [currentPostId, setCurrentPostId] = useState<string | null>(postId);
  const [serverVersion, setServerVersion] = useState<string | undefined>(
    initialVersion,
  );

  // Refs for debouncing and cleanup
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestDataRef = useRef<PostFormData | null>(null);

  // Check for localStorage recovery data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getAutoSaveStorageKey(postId);
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const validated = localStorageBackupSchema.safeParse(parsed);

        if (validated.success) {
          // Check if localStorage data is newer than server version
          const localTime = new Date(validated.data.timestamp).getTime();
          const serverTime = initialVersion
            ? new Date(initialVersion).getTime()
            : 0;

          if (localTime > serverTime) {
            setRecoveryData(validated.data);
          } else {
            // Server has newer data, clear local backup
            localStorage.removeItem(storageKey);
          }
        }
      } catch {
        // Invalid data in localStorage, remove it
        localStorage.removeItem(storageKey);
      }
    }
  }, [postId, initialVersion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Save to localStorage immediately (no debounce)
   */
  const saveToLocalStorage = useCallback(
    (data: PostFormData) => {
      if (typeof window === "undefined") return;

      const storageKey = getAutoSaveStorageKey(currentPostId);
      const backup: LocalStorageBackup = {
        timestamp: new Date().toISOString(),
        data,
        serverVersion,
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(backup));
      } catch (error) {
        // LocalStorage might be full or disabled
        logError("Failed to save to localStorage:", error);
      }
    },
    [currentPostId, serverVersion],
  );

  /**
   * Perform the actual save to server
   */
  const performSave = useCallback(
    async (data: PostFormData) => {
      if (!enabled) return;

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setStatus("saving");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/user/posts/autosave", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId: currentPostId,
            title: data.title,
            content: data.content,
            description: data.description,
            coverImage: data.coverImage,
            customAuthor: data.customAuthor,
            expectedVersion: serverVersion,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          // Check for conflict response
          if (response.status === 409) {
            const conflict = (await response.json()) as ConflictResponse;
            setStatus("conflict");
            setConflictData(conflict);
            onConflict?.(conflict);
            return;
          }

          const error = await response.json();
          throw new Error(error.error || "Auto-save failed");
        }

        const result = await response.json();

        // Update state on success
        setStatus("saved");
        setLastSaved(new Date());
        setServerVersion(result.updatedAt);

        // Update post ID if this was a new post
        if (result.isNew && result.id) {
          setCurrentPostId(result.id);

          // Move localStorage backup to new key
          const oldKey = getAutoSaveStorageKey(null);
          const newKey = getAutoSaveStorageKey(result.id);

          if (typeof window !== "undefined") {
            const existing = localStorage.getItem(oldKey);
            if (existing) {
              localStorage.setItem(newKey, existing);
              localStorage.removeItem(oldKey);
            }
          }
        }

        // Clear localStorage backup after successful save
        if (typeof window !== "undefined") {
          const storageKey = getAutoSaveStorageKey(result.id || currentPostId);
          localStorage.removeItem(storageKey);
        }

        onSaveComplete?.(result.id, result.updatedAt);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        logError("Auto-save failed:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Auto-save failed",
        );
      }
    },
    [enabled, currentPostId, serverVersion, onSaveComplete, onConflict],
  );

  /**
   * Trigger an immediate save
   */
  const triggerSave = useCallback(
    (data: PostFormData) => {
      // Clear any pending debounced save
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Save to localStorage immediately
      saveToLocalStorage(data);

      // Perform server save
      performSave(data);
    },
    [saveToLocalStorage, performSave],
  );

  /**
   * Update form data - triggers debounced save
   */
  const updateFormData = useCallback(
    (data: PostFormData) => {
      if (!enabled) return;

      // Save to localStorage immediately (no debounce)
      saveToLocalStorage(data);

      // Store latest data for debounced save
      latestDataRef.current = data;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounced timer
      debounceTimerRef.current = setTimeout(() => {
        if (latestDataRef.current) {
          performSave(latestDataRef.current);
        }
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [enabled, saveToLocalStorage, performSave],
  );

  /**
   * Recover content from localStorage
   */
  const recoverFromLocal = useCallback((): PostFormData | null => {
    if (!recoveryData) return null;

    // Clear recovery state after returning data
    const data = recoveryData.data;
    setRecoveryData(null);

    // Clear localStorage
    const storageKey = getAutoSaveStorageKey(postId);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }

    return data;
  }, [recoveryData, postId]);

  /**
   * Clear localStorage backup without recovering
   */
  const clearRecovery = useCallback(() => {
    setRecoveryData(null);
    const storageKey = getAutoSaveStorageKey(postId);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [postId]);

  /**
   * Dismiss conflict and continue editing
   */
  const dismissConflict = useCallback(() => {
    setStatus("idle");
    setConflictData(null);
  }, []);

  /**
   * Cancel any pending save operations
   */
  const cancelPendingSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    status,
    lastSaved,
    errorMessage,
    conflictData,
    recoveryData,
    currentPostId,
    triggerSave,
    updateFormData,
    recoverFromLocal,
    clearRecovery,
    dismissConflict,
    cancelPendingSave,
  };
}
