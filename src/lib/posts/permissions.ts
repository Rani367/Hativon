import { getPostById } from "./queries";
import type { Post } from "@/types/post.types";

/**
 * Check edit permission - admins can edit anything, users only their own posts
 * @param userId - The user's ID
 * @param postId - The post's ID
 * @param isAdmin - Whether the user has admin privileges
 * @param existingPost - Optional: pass the post if already fetched to avoid N+1 query
 */
export async function canUserEditPost(
  userId: string,
  postId: string,
  isAdmin: boolean,
  existingPost?: Post | null,
): Promise<boolean> {
  if (isAdmin) {
    return true;
  }

  // Use existing post if provided, otherwise fetch it
  const post =
    existingPost !== undefined ? existingPost : await getPostById(postId);
  if (!post) {
    return false;
  }

  return post.authorId === userId;
}

/**
 * Check delete permission - admins can delete anything, users only their own posts
 * @param userId - The user's ID
 * @param postId - The post's ID
 * @param isAdmin - Whether the user has admin privileges
 * @param existingPost - Optional: pass the post if already fetched to avoid N+1 query
 */
export async function canUserDeletePost(
  userId: string,
  postId: string,
  isAdmin: boolean,
  existingPost?: Post | null,
): Promise<boolean> {
  if (isAdmin) {
    return true;
  }

  // Use existing post if provided, otherwise fetch it
  const post =
    existingPost !== undefined ? existingPost : await getPostById(postId);
  if (!post) {
    return false;
  }

  return post.authorId === userId;
}
