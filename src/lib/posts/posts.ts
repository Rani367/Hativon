import {
  getPosts as getStoragePosts,
  getPublishedPostById,
} from "./queries";
import { Post } from "@/types/post.types";

/**
 * Get all published posts for public display
 * Full-route caching handles public page output; this helper stays uncached so
 * on-demand path revalidation always reads the latest database state.
 */
export async function getPosts(): Promise<Post[]> {
  const result = await getStoragePosts(true);
  return Array.isArray(result) ? result : result.posts;
}

/**
 * Get post by ID for public display
 */
export async function getPost(id: string): Promise<Post | null> {
  return getPublishedPostById(id);
}

// Re-export for backward compatibility
export { getWordCount } from "../utils/text-utils";
