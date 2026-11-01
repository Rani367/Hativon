import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { refreshAfterPostChange } from "@/lib/public-cache";
import type { User } from "@/lib/users/types";
import { getWordCount, isOpeningOfArticle } from "./reading";
import { composeByline, generateDescription } from "./rules";

/**
 * Reading and writing posts for writers and teachers. Every change to a post
 * goes through here, so public pages always get refreshed.
 */

export interface StudioPost {
  id: string;
  title: string;
  content: string;
  description: string;
  coverImage?: string;
  author?: string;
  authorId?: string;
  status: "draft" | "published";
  aiGeneratedImage: boolean;
  teacherHold: boolean;
  date: string;
  updatedAt: string;
  readCount: number;
}

export type PostFilter = { search?: string; status?: string };

type Row = Record<string, unknown>;

function toStudioPost(row: Row): StudioPost {
  return {
    id: row.id as string,
    title: row.title as string,
    content: (row.content as string) ?? "",
    description: row.description as string,
    coverImage: (row.cover_image as string | null) || undefined,
    author: (row.author as string | null) || undefined,
    authorId: (row.author_id as string | null) || undefined,
    status: row.status as StudioPost["status"],
    aiGeneratedImage: row.ai_generated_image === true,
    teacherHold: row.teacher_hold === true,
    date: (row.date as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    readCount: (row.read_count as number | null) ?? 0,
  };
}

export async function getStudioPost(id: string): Promise<StudioPost | null> {
  const rows = await db()`
    SELECT
      p.id, p.title, p.content, p.description, p.cover_image, p.author, p.author_id,
      p.status, p.ai_generated_image, p.teacher_hold,
      p.date AT TIME ZONE 'UTC' AS date,
      p.updated_at AT TIME ZONE 'UTC' AS updated_at,
      r.read_count
    FROM posts p
    LEFT JOIN post_reads r ON r.post_id = p.id
    WHERE p.id = ${id}
  `;
  return rows[0] ? toStudioPost(rows[0]) : null;
}

/** Posts for a list, filtered in the database so paging can never hide a match. */
export async function listPosts(
  { search, status }: PostFilter,
  authorId?: string,
): Promise<StudioPost[]> {
  const term = search?.trim() ? `%${search.trim()}%` : null;
  const rows = await db()`
    SELECT
      p.id, p.title, p.description, p.cover_image, p.author, p.author_id,
      p.status, p.ai_generated_image, p.teacher_hold,
      p.date AT TIME ZONE 'UTC' AS date,
      p.updated_at AT TIME ZONE 'UTC' AS updated_at,
      r.read_count
    FROM posts p
    LEFT JOIN post_reads r ON r.post_id = p.id
    WHERE (${authorId ?? null}::text IS NULL OR p.author_id = ${authorId ?? null})
      AND (${status ?? null}::text IS NULL OR p.status = ${status ?? null})
      AND (${term}::text IS NULL OR p.title ILIKE ${term})
    ORDER BY p.updated_at DESC
    LIMIT 200
  `;
  return rows.map(toStudioPost);
}

export async function getPostStats() {
  const rows = await db()`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'published')::int AS published,
      COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::int AS week
    FROM posts
  `;
  const reads = await db()`SELECT COALESCE(SUM(read_count), 0)::int AS total FROM post_reads`;

  return {
    total: rows[0].total as number,
    published: rows[0].published as number,
    drafts: rows[0].drafts as number,
    week: rows[0].week as number,
    reads: reads[0].total as number,
  };
}

export interface PostFields {
  title?: string;
  content?: string;
  description?: string;
  coverImage?: string;
  customAuthor?: string;
  aiGeneratedImage?: boolean;
}

export async function createDraft(
  user: User,
  fields: PostFields,
): Promise<StudioPost> {
  const id = randomUUID();
  const content = fields.content ?? "";

  // The slug column is required and unique. The id is used so it's always free.
  await db()`
    INSERT INTO posts (
      id, slug, title, content, cover_image, description, word_count, date, author,
      author_id, author_grade, author_class, is_teacher_post, ai_generated_image,
      tags, status, created_at, updated_at
    )
    VALUES (
      ${id}, ${id}, ${fields.title ?? ""}, ${content}, ${fields.coverImage ?? null},
      ${fields.description?.trim() || generateDescription(content)},
      ${getWordCount(content)}, CURRENT_TIMESTAMP,
      ${composeByline(user, fields.customAuthor, undefined)},
      ${user.id}, ${user.grade}, ${user.classNumber}, ${user.isTeacher},
      ${fields.aiGeneratedImage ?? false}, ${[]}::text[], 'draft',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `;

  return (await getStudioPost(id))!;
}

/**
 * A description the writer typed stays until they change it. An automatic one
 * follows the article, and clearing the field goes back to automatic.
 */
function nextDescription(
  post: StudioPost,
  requested: string | undefined,
  content: string,
): string {
  if (requested !== undefined) {
    return requested.trim() || generateDescription(content);
  }

  const isAutomatic =
    !post.description || isOpeningOfArticle(post.description, post.content);
  return isAutomatic ? generateDescription(content) : post.description;
}

/** Saves fields without changing whether the post is public. */
export async function updatePostFields(
  user: User,
  post: StudioPost,
  fields: PostFields,
): Promise<StudioPost> {
  const content = fields.content ?? post.content;
  const description = nextDescription(post, fields.description, content);

  await db()`
    UPDATE posts SET
      title = ${fields.title ?? post.title},
      content = ${content},
      description = ${description},
      word_count = ${getWordCount(content)},
      cover_image = ${fields.coverImage === undefined ? (post.coverImage ?? null) : fields.coverImage || null},
      author = ${composeByline(user, fields.customAuthor, post.author)},
      ai_generated_image = ${fields.aiGeneratedImage ?? post.aiGeneratedImage}
    WHERE id = ${post.id}
  `;

  const updated = (await getStudioPost(post.id))!;
  refreshAfterPostChange(post, updated);
  return updated;
}

/**
 * Publishes a post. posts.date decides its issue, so the first publish moves it
 * to today: a draft started in March and finished in May belongs to May. After
 * that the issue never changes, even if the post is unpublished and put back.
 */
export async function publishPost(post: StudioPost): Promise<void> {
  await db()`
    UPDATE posts SET
      date = CASE WHEN first_published_at IS NULL THEN CURRENT_TIMESTAMP ELSE date END,
      first_published_at = COALESCE(first_published_at, CURRENT_TIMESTAMP),
      teacher_hold = FALSE,
      status = 'published'
    WHERE id = ${post.id}
  `;
  refreshAfterPostChange(post, { id: post.id, status: "published" });
}

/** Back to draft, keeping the post's issue. A teacher's unpublish also holds it. */
export async function unpublishPost(
  post: StudioPost,
  byTeacher: boolean,
): Promise<void> {
  await db()`
    UPDATE posts SET
      first_published_at = COALESCE(first_published_at, date),
      teacher_hold = ${byTeacher},
      status = 'draft'
    WHERE id = ${post.id}
  `;
  refreshAfterPostChange(post, { id: post.id, status: "draft" });
}

export async function deletePost(post: StudioPost): Promise<void> {
  await db()`DELETE FROM posts WHERE id = ${post.id}`;
  refreshAfterPostChange(post, null);
}

export async function setAiImageFlags(
  authorId: string,
  answers: Record<string, boolean>,
): Promise<void> {
  for (const [id, aiGenerated] of Object.entries(answers)) {
    await db()`
      UPDATE posts SET ai_generated_image = ${aiGenerated}
      WHERE id = ${id} AND author_id = ${authorId}
    `;
  }
}
