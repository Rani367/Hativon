import type { DbPostRow } from "@/types/database.types";
import type { Post } from "@/types/post.types";

export const MAX_DESCRIPTION_LENGTH = 160;

// converts title to url-friendly slug, keeps hebrew chars
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\u0590-\u05FFa-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

// strips markdown and truncates for preview
export function generateDescription(content: string): string {
  const plainText = content
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/`[^`]*`/g, "") // inline code
    .replace(/[#*_~\[\]()]/g, "") // markdown syntax
    .replace(/\s+/g, " ")
    .trim();

  return plainText.length > MAX_DESCRIPTION_LENGTH
    ? plainText.substring(0, MAX_DESCRIPTION_LENGTH) + "..."
    : plainText;
}

// db row -> Post object (snake_case to camelCase)
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
    authorDeleted: row.author_deleted || false,
    isTeacherPost: row.is_teacher_post || false,
    tags: row.tags || [],
    category: row.category || undefined,
    status: row.status as "draft" | "published",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
