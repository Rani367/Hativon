import { getPostById } from './queries';

/**
 * Check if a user has permission to edit a specific post
 *
 * Permission rules:
 * - Admin users (authenticated with ADMIN_PASSWORD) can edit all posts
 * - Regular users can only edit posts they authored
 *
 * @param userId - User ID to check
 * @param postId - Post ID to check
 * @param isAdmin - Whether user is authenticated as admin (ADMIN_PASSWORD auth)
 * @returns true if user can edit the post
 */
export async function canUserEditPost(
  userId: string,
  postId: string,
  isAdmin: boolean
): Promise<boolean> {
  if (isAdmin) {
    return true;
  }

  const post = await getPostById(postId);
  if (!post) {
    return false;
  }

  return post.authorId === userId;
}

/**
 * Check if a user has permission to delete a specific post
 *
 * Permission rules:
 * - Admin users (authenticated with ADMIN_PASSWORD) can delete all posts
 * - Regular users can only delete posts they authored
 *
 * @param userId - User ID to check
 * @param postId - Post ID to check
 * @param isAdmin - Whether user is authenticated as admin (ADMIN_PASSWORD auth)
 * @returns true if user can delete the post
 */
export async function canUserDeletePost(
  userId: string,
  postId: string,
  isAdmin: boolean
): Promise<boolean> {
  if (isAdmin) {
    return true;
  }

  const post = await getPostById(postId);
  if (!post) {
    return false;
  }

  return post.authorId === userId;
}
