import type { Post, PostInput } from "@/types/post.types";
import type { PostQueryResult, DbMutationResult } from "@/types/database.types";
import { db } from "../db/client";
import { v4 as uuidv4 } from "uuid";
import { generateDescription, rowToPost } from "./utils";
import { getPostById } from "./queries";
import { safeRevalidateTag } from "../cache/revalidate";

/**
 * Default post status for new posts
 */
const DEFAULT_POST_STATUS = "draft" as const;

/**
 * Create a new post
 * Automatically generates ID and description
 *
 * @param input - Post data (without auto-generated fields)
 * @returns Created Post object
 * @throws Error if database insertion fails
 */
export async function createPost(input: PostInput): Promise<Post> {
  const id = uuidv4();
  const now = new Date();
  // Use custom description if provided, otherwise auto-generate from content
  const description =
    input.description && input.description.trim()
      ? input.description.trim()
      : generateDescription(input.content);
  const status = input.status || DEFAULT_POST_STATUS;

  try {
    const result = (await db.query`
      INSERT INTO posts (
        id, slug, title, content, cover_image, description,
        date, author, author_id, author_grade, author_class,
        is_teacher_post, tags, category, status, created_at, updated_at
      )
      VALUES (
        ${id},
        ${id},
        ${input.title},
        ${input.content},
        ${input.coverImage || null},
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
    safeRevalidateTag("posts", "max");

    return post;
  } catch (error) {
    console.error("[ERROR] Failed to create post:", error);
    throw error;
  }
}

/**
 * Update an existing post
 * Only updates provided fields, regenerates description if content changes
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

    // Merge input with existing values so we can use a static template literal query
    const title = input.title !== undefined ? input.title : existing.title;
    const content =
      input.content !== undefined ? input.content : existing.content;
    const description =
      input.description && input.description.trim()
        ? input.description.trim()
        : input.content !== undefined
          ? generateDescription(input.content)
          : existing.description;
    const coverImage =
      input.coverImage !== undefined
        ? input.coverImage
        : existing.coverImage;
    const author =
      input.author !== undefined ? input.author : existing.author;
    const authorId =
      input.authorId !== undefined ? input.authorId : existing.authorId;
    const authorGrade =
      input.authorGrade !== undefined
        ? input.authorGrade
        : existing.authorGrade;
    const authorClass =
      input.authorClass !== undefined
        ? input.authorClass
        : existing.authorClass;
    const tags = input.tags !== undefined ? input.tags : existing.tags;
    const category =
      input.category !== undefined ? input.category : existing.category;
    const status =
      input.status !== undefined ? input.status : existing.status;

    const result = (await db.query`
      UPDATE posts SET
        title = ${title},
        content = ${content},
        description = ${description},
        cover_image = ${coverImage || null},
        author = ${author || null},
        author_id = ${authorId || null},
        author_grade = ${authorGrade || null},
        author_class = ${authorClass || null},
        tags = ${tags || []},
        category = ${category || null},
        status = ${status},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `) as PostQueryResult;

    if (result.rows.length === 0) {
      return null;
    }

    const post = rowToPost(result.rows[0]);

    // Revalidate cache to show updates instantly
    safeRevalidateTag("posts", "max");

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
      safeRevalidateTag("posts", "max");
    }

    return deleted;
  } catch (error) {
    console.error("[ERROR] Failed to delete post:", error);
    return false;
  }
}
