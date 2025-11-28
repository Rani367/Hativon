import {
  getPosts as getStoragePosts,
  getPostBySlug as getStoragePostBySlug,
} from "./queries";
import { Post } from "@/types/post.types";
import { unstable_cache } from "next/cache";

/**
 * Get all published posts for public display
 * Uses Next.js cache for instant loading with 60s revalidation
 */
export const getPosts = unstable_cache(
  async (): Promise<Post[]> => {
    return getStoragePosts(true); // Only published posts
  },
  ["posts-public"],
  {
    revalidate: 60, // Revalidate every 60 seconds
    tags: ["posts"],
  },
);

/**
 * Get post by slug for public display
 * Uses Next.js cache for instant loading with 60s revalidation
 */
export const getPost = unstable_cache(
  async (slug: string): Promise<Post | null> => {
    return getStoragePostBySlug(slug);
  },
  ["post-by-slug"],
  {
    revalidate: 60,
    tags: ["posts"],
  },
);

// Re-export for backward compatibility
export { getWordCount } from "../utils/text-utils";
