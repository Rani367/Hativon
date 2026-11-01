import { z } from "zod";

/**
 * Autosave's wire format and browser storage. The localStorage keys must stay
 * exactly as they are, so a draft someone is recovering survives the launch.
 */

/** Covers come from our own uploads, so a post can't point readers elsewhere. */
export const coverImageSchema = z
  .string()
  .regex(
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//,
    "כתובת תמונה לא תקינה",
  );

// Existing posts have longer descriptions than new ones are allowed, and their
// writers must still be able to save them.
const storedDescription = z.string().max(1000).optional();

export const autoSavePayloadSchema = z.object({
  postId: z.string().uuid().nullable().optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(50_000).optional(),
  description: storedDescription,
  coverImage: coverImageSchema.optional(),
  customAuthor: z.string().max(100).optional(),
  expectedVersion: z.string().datetime().optional(),
});

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

export type ConflictResponse = z.infer<typeof conflictResponseSchema>;
export type LocalStorageBackup = z.infer<typeof localStorageBackupSchema>;

export interface PostFormData {
  title: string;
  content: string;
  description?: string;
  coverImage?: string;
  customAuthor?: string;
}

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

export const AUTOSAVE_STORAGE_KEY_NEW = "hativon_autosave_new";
export const AUTOSAVE_STORAGE_KEY_PREFIX = "hativon_autosave_post_";
export const AUTOSAVE_DRAFT_ID_KEY = "hativon_current_draft_id";

export function getAutoSaveStorageKey(postId: string | null): string {
  return postId
    ? `${AUTOSAVE_STORAGE_KEY_PREFIX}${postId}`
    : AUTOSAVE_STORAGE_KEY_NEW;
}
