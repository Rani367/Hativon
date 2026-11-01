import { cache } from "react";
import { db } from "@/lib/db";
import type { ArchiveMonth } from "@/lib/issues/merge-core";
import { CREATOR_USERNAME } from "@/lib/site";
import type { Post, PostSummary } from "./types";

/**
 * Read queries for public pages.
 *
 * None of these catch database errors. If a query fails while Vercel is
 * regenerating a page, the render fails and the previous page stays up. The old
 * app returned empty results here, which got an outage cached as an empty issue
 * or a fake 404.
 *
 * `p.date AT TIME ZONE 'UTC'` reads the zone-less timestamp as UTC, so results
 * don't depend on the machine's time zone.
 */

type Row = Record<string, unknown>;

function toSummary(row: Row): PostSummary {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    coverImage: (row.cover_image as string | null) || undefined,
    wordCount: (row.word_count as number | null) ?? 0,
    date: (row.date as Date).toISOString(),
    author: (row.author as string | null) || undefined,
    authorGrade: (row.author_grade as string | null) || undefined,
    authorClass: (row.author_class as number | null) || undefined,
    authorDeleted: row.author_deleted === true,
    isTeacherPost: row.is_teacher_post === true,
    isCreatorPost: row.is_creator_post === true,
    aiGeneratedImage: row.ai_generated_image === true,
  };
}

function toPost(row: Row): Post {
  return {
    ...toSummary(row),
    content: row.content as string,
    tags: (row.tags as string[] | null) ?? [],
    category: (row.category as string | null) || undefined,
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

/** Published articles in a range with their full text, for printing an issue. */
export async function getPublishedArticlesInRange(
  startInclusive: string,
  endExclusive: string,
): Promise<Post[]> {
  const rows = await db()`
    SELECT
      p.id, p.title, p.description, p.content, p.cover_image, p.word_count,
      p.date AT TIME ZONE 'UTC' AS date,
      p.updated_at AT TIME ZONE 'UTC' AS updated_at,
      p.author, p.author_grade, p.author_class,
      p.is_teacher_post, p.ai_generated_image, p.tags, p.category,
      (u.id IS NULL AND p.author_id IS NOT NULL) AS author_deleted,
      (u.username IS NOT DISTINCT FROM ${CREATOR_USERNAME}) AS is_creator_post
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id::text
    WHERE p.status = 'published'
      AND p.date >= ${startInclusive}
      AND p.date < ${endExclusive}
    ORDER BY
      p.ai_generated_image ASC,
      (p.cover_image IS NOT NULL AND p.cover_image <> '') DESC,
      p.date DESC
  `;

  return rows.map(toPost);
}

/** Published posts in a half-open date range, in reading order. */
export async function getPublishedPostsInRange(
  startInclusive: string,
  endExclusive: string,
): Promise<PostSummary[]> {
  const rows = await db()`
    SELECT
      p.id, p.title, p.description, p.cover_image, p.word_count,
      p.date AT TIME ZONE 'UTC' AS date,
      p.author, p.author_grade, p.author_class,
      p.is_teacher_post, p.ai_generated_image,
      (u.id IS NULL AND p.author_id IS NOT NULL) AS author_deleted,
      (u.username IS NOT DISTINCT FROM ${CREATOR_USERNAME}) AS is_creator_post
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id::text
    WHERE p.status = 'published'
      AND p.date >= ${startInclusive}
      AND p.date < ${endExclusive}
    ORDER BY
      p.ai_generated_image ASC,
      (p.cover_image IS NOT NULL AND p.cover_image <> '') DESC,
      p.date DESC
  `;

  return rows.map(toSummary);
}

/**
 * One published post, or null. `idOrSlug` also accepts the old title-based slugs
 * that 20 posts still have, so those links work again.
 *
 * Wrapped in cache() because metadata and the page both ask for it.
 */
export const getPublishedPost = cache(
  async (idOrSlug: string): Promise<Post | null> => {
    const rows = await db()`
      SELECT
        p.id, p.title, p.description, p.content, p.cover_image, p.word_count,
        p.date AT TIME ZONE 'UTC' AS date,
        p.updated_at AT TIME ZONE 'UTC' AS updated_at,
        p.author, p.author_grade, p.author_class,
        p.is_teacher_post, p.ai_generated_image, p.tags, p.category,
        (u.id IS NULL AND p.author_id IS NOT NULL) AS author_deleted,
        (u.username IS NOT DISTINCT FROM ${CREATOR_USERNAME}) AS is_creator_post
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id::text
      WHERE p.status = 'published'
        AND (p.id = ${idOrSlug} OR p.slug = ${idOrSlug})
      LIMIT 1
    `;

    return rows[0] ? toPost(rows[0]) : null;
  },
);

/**
 * Published articles containing a term, title matches first. Both sides go
 * through normalize_search_text in the database, so they can't drift apart.
 */
export async function searchPublishedPosts(term: string): Promise<PostSummary[]> {
  const rows = await db()`
    WITH search AS (
      SELECT '%' || replace(normalize_search_text(${term}), '%', '\\%') || '%' AS pattern
    )
    SELECT
      p.id, p.title, p.description, p.cover_image, p.word_count,
      p.date AT TIME ZONE 'UTC' AS date,
      p.author, p.author_grade, p.author_class,
      p.is_teacher_post, p.ai_generated_image,
      (u.id IS NULL AND p.author_id IS NOT NULL) AS author_deleted,
      (u.username IS NOT DISTINCT FROM ${CREATOR_USERNAME}) AS is_creator_post
    FROM posts p
    CROSS JOIN search
    LEFT JOIN users u ON p.author_id = u.id::text
    WHERE p.status = 'published' AND p.search_text LIKE search.pattern
    ORDER BY
      (normalize_search_text(p.title) LIKE search.pattern) DESC,
      p.date DESC
    LIMIT 30
  `;

  return rows.map(toSummary);
}

/** Every month with published posts, newest first. */
export async function getArchiveMonths(): Promise<ArchiveMonth[]> {
  const rows = await db()`
    SELECT
      EXTRACT(YEAR FROM date)::int AS year,
      EXTRACT(MONTH FROM date)::int AS month,
      COUNT(*)::int AS count
    FROM posts
    WHERE status = 'published'
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `;

  return rows.map((row) => ({
    year: row.year as number,
    month: row.month as number,
    count: row.count as number,
  }));
}

/** Ids and edit times only, so the sitemap never loads article bodies. */
export async function getPublishedPostStamps(): Promise<
  { id: string; updatedAt: string }[]
> {
  const rows = await db()`
    SELECT id, updated_at AT TIME ZONE 'UTC' AS updated_at
    FROM posts
    WHERE status = 'published'
    ORDER BY date DESC
  `;

  return rows.map((row) => ({
    id: row.id as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  }));
}
