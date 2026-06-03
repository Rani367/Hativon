import type { DbPostRow, DbPostSummaryRow } from "@/types/database.types";
import type { Post, PostSummary } from "@/types/post.types";
import { MAX_POST_DESCRIPTION_LENGTH } from "@/lib/constants";
import { getWordCount } from "@/lib/utils/text-utils";

export const MAX_DESCRIPTION_LENGTH = MAX_POST_DESCRIPTION_LENGTH;

export function truncateDescription(description: string): string {
  const normalizedDescription = description.trim();

  return normalizedDescription.length > MAX_DESCRIPTION_LENGTH
    ? normalizedDescription.substring(0, MAX_DESCRIPTION_LENGTH).trimEnd() +
        "..."
    : normalizedDescription;
}

// strips markdown and truncates for preview
export function generateDescription(content: string): string {
  const plainText = content
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/`[^`]*`/g, "") // inline code
    .replace(/[#*_~\[\]()]/g, "") // markdown syntax
    .replace(/&nbsp;/gi, " ") // blank-line markers
    .replace(/\s+/g, " ")
    .trim();

  return truncateDescription(plainText);
}

// db row -> Post object (snake_case to camelCase)
export function rowToPost(row: DbPostRow): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    coverImage: row.cover_image || undefined,
    description: row.description,
    wordCount: row.word_count ?? getWordCount(row.content),
    date: row.date.toISOString(),
    author: row.author || undefined,
    authorId: row.author_id || undefined,
    authorGrade: row.author_grade || undefined,
    authorClass: row.author_class || undefined,
    authorDeleted: row.author_deleted || false,
    isTeacherPost: row.is_teacher_post || false,
    aiGeneratedImage: row.ai_generated_image || false,
    tags: row.tags || [],
    category: row.category || undefined,
    status: row.status as "draft" | "published",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function rowToPostSummary(row: DbPostSummaryRow): PostSummary {
  return {
    id: row.id,
    title: row.title,
    coverImage: row.cover_image || undefined,
    description: row.description,
    wordCount: row.word_count ?? 0,
    date: row.date.toISOString(),
    author: row.author || undefined,
    authorGrade: row.author_grade || undefined,
    authorClass: row.author_class || undefined,
    authorDeleted: row.author_deleted || false,
    isTeacherPost: row.is_teacher_post || false,
    aiGeneratedImage: row.ai_generated_image || false,
    tags: row.tags || [],
    category: row.category || undefined,
  };
}
