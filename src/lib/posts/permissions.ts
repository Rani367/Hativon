import { getPostById } from "./queries";

// Check edit permission - admins can edit anything, users only their own posts
export async function canUserEditPost(
  userId: string,
  postId: string,
  isAdmin: boolean,
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

// Same logic as edit
export async function canUserDeletePost(
  userId: string,
  postId: string,
  isAdmin: boolean,
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
