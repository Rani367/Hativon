import type { Post, PostInput } from "@/types/post.types";
import type { PostQueryResult, DbMutationResult } from "@/types/database.types";
import { db } from "../db/client";
import { v4 as uuidv4 } from "uuid";
import { generateSlug, generateDescription, rowToPost } from "./utils";
import { getPostById } from "./queries";
import { revalidateTag } from "next/cache";

/**
 * Default post status for new posts
 */
const DEFAULT_POST_STATUS = "draft" as const;

/**
 * Create a new post
 * Automatically generates ID, slug, and description
 *
 * @param input - Post data (without auto-generated fields)
 * @returns Created Post object
 * @throws Error if database insertion fails
 */
export async function createPost(input: PostInput): Promise<Post> {
  const id = uuidv4();
  const now = new Date();
  const slug = generateSlug(input.title);
  // Use custom description if provided, otherwise auto-generate from content
  const description =
    input.description && input.description.trim()
      ? input.description.trim()
      : generateDescription(input.content);
  const status = input.status || DEFAULT_POST_STATUS;

  try {
    const result = (await db.query`
      INSERT INTO posts (
        id, title, slug, content, cover_image, description,
        date, author, author_id, author_grade, author_class,
        is_teacher_post, tags, category, status, created_at, updated_at
      )
      VALUES (
        ${id},
        ${input.title},
        ${slug},
        ${input.content},
        ${input.coverImage},
        ${description},
        ${now},
        ${input.author || null},
        ${input.authorId || null},
        ${input.authorGrade || null},
        ${input.authorClass || null},
        ${input.isTeacherPost || false},
        ${input.tags || []},
        ${input.category || null},
        ${status},
        ${now},
        ${now}
      )
      RETURNING *
    `) as PostQueryResult;

    const post = rowToPost(result.rows[0]);

    // Revalidate cache to show new post instantly
    revalidateTag("posts", "max");

    return post;
  } catch (error) {
    console.error("[ERROR] Failed to create post:", error);
    throw error;
  }
}

/**
 * Update an existing post
 * Only updates provided fields, regenerates slug/description if title/content change
 *
 * @param id - Post UUID
 * @param input - Partial post data to update
 * @returns Updated Post object or null if post not found
 * @throws Error if database update fails
 */
export async function updatePost(
  id: string,
  input: Partial<PostInput>,
): Promise<Post | null> {
  try {
    // Verify post exists
    const existing = await getPostById(id);
    if (!existing) {
      return null;
    }

    // Build dynamic update fields
    const updates: Record<string, string | number | string[] | null> = {};

    if (input.title !== undefined) {
      updates.title = input.title;
      updates.slug = generateSlug(input.title);
    }

    if (input.content !== undefined) {
      updates.content = input.content;
      updates.description = generateDescription(input.content);
    }

    if (input.coverImage !== undefined) updates.cover_image = input.coverImage;
    if (input.author !== undefined) updates.author = input.author;
    if (input.authorId !== undefined) updates.author_id = input.authorId;
    if (input.authorGrade !== undefined)
      updates.author_grade = input.authorGrade;
    if (input.authorClass !== undefined)
      updates.author_class = input.authorClass;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.category !== undefined) updates.category = input.category;
    if (input.status !== undefined) updates.status = input.status;

    // Build parameterized query
    const setters = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const values = Object.values(updates);

    // Build query parameters array with query string as first element
    const queryString = `UPDATE posts SET ${setters}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    const queryArray = [queryString, id, ...values] as (
      | string
      | number
      | string[]
      | null
    )[];

    const result = (await db.query(queryArray)) as PostQueryResult;

    if (result.rows.length === 0) {
      return null;
    }

    const post = rowToPost(result.rows[0]);

    // Revalidate cache to show updates instantly
    revalidateTag("posts", "max");

    return post;
  } catch (error) {
    console.error("[ERROR] Failed to update post:", error);
    throw error;
  }
}

/**
 * Delete a post permanently
 *
 * @param id - Post UUID
 * @returns true if post was deleted, false if not found or deletion failed
 */
export async function deletePost(id: string): Promise<boolean> {
  try {
    const result = (await db.query`
      DELETE FROM posts
      WHERE id = ${id}
    `) as unknown as DbMutationResult;

    const deleted = result.rowCount > 0;

    // Revalidate cache to remove deleted post instantly
    if (deleted) {
      revalidateTag("posts", "max");
    }

    return deleted;
  } catch (error) {
    console.error("[ERROR] Failed to delete post:", error);
    return false;
  }
}
