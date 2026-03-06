/**
 * Post query re-exports
 *
 * Previously used unstable_cache wrappers, but these caused stale empty
 * results under Bun runtime on Vercel. ISR page-level caching (revalidate)
 * handles caching instead -- each page revalidation queries the DB directly.
 */

export {
  getPosts as getCachedPosts,
  getPostStats as getCachedPostStats,
  getPublishedPostById as getCachedPublishedPostById,
  getPostsByMonth as getCachedPostsByMonth,
  getArchiveMonths as getCachedArchiveMonths,
} from "./queries";

export { getDefaultMonthWithFallback as getCachedDefaultMonth } from "@/lib/settings";
