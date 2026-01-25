import {
  getPosts as getStoragePosts,
  getPublishedPostById,
} from "./queries";
import { Post } from "@/types/post.types";
import { unstable_cache } from "next/cache";

/**
 * Get all published posts for public display
 * Uses Next.js cache for instant loading with 60s revalidation
 */
export const getPosts = unstable_cache(
  async (): Promise<Post[]> => {
    const result = await getStoragePosts(true); // Only published posts
    return Array.isArray(result) ? result : result.posts;
  },
  ["posts-public"],
  {
    revalidate: 60, // Revalidate every 60 seconds
    tags: ["posts"],
  },
);

/**
 * Get post by ID for public display
 * Uses Next.js cache for instant loading with 60s revalidation
 */
export const getPost = unstable_cache(
  async (id: string): Promise<Post | null> => {
    return getPublishedPostById(id);
  },
  ["post-by-id"],
  {
    revalidate: 60,
    tags: ["posts"],
  },
);

// Re-export for backward compatibility
export { getWordCount } from "../utils/text-utils";
