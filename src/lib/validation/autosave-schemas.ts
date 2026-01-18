/**
 * Zod validation schemas for auto-save functionality
 * Provides validation for partial post data during auto-save operations
 */

import { z } from "zod";
import { postDescriptionSchema, coverImageSchema } from "./schemas";

/**
 * Relaxed title schema for auto-save - allows empty strings
 */
const autoSaveTitleSchema = z
  .string()
  .max(200, "כותרת לא יכולה להיות יותר מ-200 תווים")
  .optional();

/**
 * Relaxed content schema for auto-save - allows empty strings
 */
const autoSaveContentSchema = z
  .string()
  .max(50000, "תוכן לא יכול להיות יותר מ-50,000 תווים")
  .optional();

/**
 * Auto-save payload schema - allows partial post data
 * Used when saving draft content to the server
 */
export const autoSavePayloadSchema = z.object({
  // Post identification - postId is null for new posts
  postId: z.string().uuid().nullable().optional(),

  // Content fields - all optional for auto-save (allows empty strings)
  title: autoSaveTitleSchema,
  content: autoSaveContentSchema,
  description: postDescriptionSchema,
  coverImage: coverImageSchema,
  customAuthor: z.string().max(100).optional(),

  // Conflict detection - timestamp of when form was loaded
  expectedVersion: z.string().datetime().optional(),
});

/**
 * Auto-save response schema
 */
export const autoSaveResponseSchema = z.object({
  success: z.boolean(),
  id: z.string().uuid(),
  updatedAt: z.string().datetime(),
  isNew: z.boolean().optional(),
});

/**
 * Conflict response schema - returned when server version differs
 */
export const conflictResponseSchema = z.object({
  conflict: z.literal(true),
  serverVersion: z.string().datetime(),
  serverContent: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    customAuthor: z.string().optional(),
  }),
});

/**
 * LocalStorage backup schema for crash recovery
 */
export const localStorageBackupSchema = z.object({
  timestamp: z.string().datetime(),
  data: z.object({
    title: z.string(),
    content: z.string(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    customAuthor: z.string().optional(),
  }),
  serverVersion: z.string().datetime().optional(),
});

/**
 * Type exports for validated data
 */
export type AutoSavePayload = z.infer<typeof autoSavePayloadSchema>;
export type AutoSaveResponse = z.infer<typeof autoSaveResponseSchema>;
export type ConflictResponse = z.infer<typeof conflictResponseSchema>;
export type LocalStorageBackup = z.infer<typeof localStorageBackupSchema>;

/**
 * Form data type used in auto-save operations
 */
export interface PostFormData {
  title: string;
  content: string;
  description?: string;
  coverImage?: string;
  customAuthor?: string;
}

/**
 * Auto-save status types
 */
export type AutoSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

/**
 * LocalStorage keys for auto-save backups
 */
export const AUTOSAVE_STORAGE_KEY_NEW = "hativon_autosave_new";
export const AUTOSAVE_STORAGE_KEY_PREFIX = "hativon_autosave_post_";

/**
 * Get storage key for a specific post
 */
export function getAutoSaveStorageKey(postId: string | null): string {
  return postId
    ? `${AUTOSAVE_STORAGE_KEY_PREFIX}${postId}`
    : AUTOSAVE_STORAGE_KEY_NEW;
}
