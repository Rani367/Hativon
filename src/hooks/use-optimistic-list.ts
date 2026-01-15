"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseOptimisticListOptions<T> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  getItemId: (item: T) => string;
}

interface OptimisticDeleteOptions {
  errorMessage?: string;
}

interface RollbackData<T> {
  item: T;
  index: number;
}

/**
 * Hook for optimistic list operations.
 * Provides instant UI updates with automatic rollback on API failure.
 *
 * @example
 * const { optimisticDelete, isPending } = useOptimisticList({
 *   items: posts,
 *   setItems: setPosts,
 *   getItemId: (post) => post.id,
 * });
 *
 * // In delete handler:
 * await optimisticDelete(
 *   postId,
 *   () => fetch(`/api/posts/${postId}`, { method: "DELETE" }),
 *   { errorMessage: "Failed to delete post" }
 * );
 */
export function useOptimisticList<T>({
  items,
  setItems,
  getItemId,
}: UseOptimisticListOptions<T>) {
  // Track pending operations to prevent double-clicks
  const pendingRef = useRef<Set<string>>(new Set());
  // Store original items for rollback
  const rollbackRef = useRef<Map<string, RollbackData<T>>>(new Map());

  /**
   * Check if an operation is pending for a given ID.
   * Use this to disable buttons during operations.
   */
  const isPending = useCallback((id: string): boolean => {
    return pendingRef.current.has(id);
  }, []);

  /**
   * Optimistically delete an item from the list.
   * The item is removed immediately, and restored if the API call fails.
   */
  const optimisticDelete = useCallback(
    async (
      id: string,
      deleteAction: () => Promise<Response>,
      options?: OptimisticDeleteOptions
    ): Promise<void> => {
      // Prevent double-click
      if (pendingRef.current.has(id)) return;
      pendingRef.current.add(id);

      // Find and store original item for potential rollback
      const index = items.findIndex((item) => getItemId(item) === id);
      const originalItem = items[index];

      if (originalItem) {
        rollbackRef.current.set(id, { item: originalItem, index });
      }

      // Optimistically remove item from list
      setItems((current) => current.filter((item) => getItemId(item) !== id));

      try {
        const response = await deleteAction();

        if (!response.ok) {
          throw new Error("Delete operation failed");
        }
        // Success - item stays removed, no toast needed (instant feedback)
      } catch {
        // Rollback - restore the original item at its position
        const rollback = rollbackRef.current.get(id);
        if (rollback) {
          setItems((current) => {
            const newItems = [...current];
            // Insert at original position, or at end if list is now shorter
            const insertIndex = Math.min(rollback.index, newItems.length);
            newItems.splice(insertIndex, 0, rollback.item);
            return newItems;
          });
        }

        // Show error toast
        toast.error(options?.errorMessage || "הפעולה נכשלה");
      } finally {
        // Cleanup tracking refs
        pendingRef.current.delete(id);
        rollbackRef.current.delete(id);
      }
    },
    [items, setItems, getItemId]
  );

  return {
    optimisticDelete,
    isPending,
  };
}
