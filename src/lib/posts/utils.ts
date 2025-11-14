import type { DbPostRow } from '@/types/database.types';
import type { Post } from '@/types/post.types';

/**
 * Maximum length for auto-generated post descriptions
 */
export const MAX_DESCRIPTION_LENGTH = 160;

/**
 * Generate URL-friendly slug from title
 * Converts title to lowercase and replaces non-alphanumeric characters with hyphens
 *
 * @example
 * generateSlug("Hello World!") // "hello-world"
 * generateSlug("כותרת בעברית") // "כותרת-בעברית"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate description from markdown content
 * Strips markdown syntax and truncates to MAX_DESCRIPTION_LENGTH characters
 *
 * @param content - Markdown content
 * @returns Plain text description (max 160 chars)
 */
export function generateDescription(content: string): string {
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/[#*_~\[\]()]/g, '') // Remove markdown syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return plainText.length > MAX_DESCRIPTION_LENGTH
    ? plainText.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
    : plainText;
}

/**
 * Convert database row to Post object
 * Transforms snake_case database columns to camelCase TypeScript properties
 *
 * @param row - Database post row
 * @returns Formatted Post object
 */
export function rowToPost(row: DbPostRow): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    coverImage: row.cover_image || undefined,
    description: row.description,
    date: row.date.toISOString(),
    author: row.author || undefined,
    authorId: row.author_id || undefined,
    authorGrade: row.author_grade || undefined,
    authorClass: row.author_class || undefined,
    tags: row.tags || [],
    category: row.category || undefined,
    status: row.status as 'draft' | 'published',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
