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
  getPostSummariesByMonth as getCachedPostSummariesByMonth,
} from "./queries";

// Archive months are served with merged "double issues" collapsed into a single
// entry, and `getIssue` resolves a (year, month) to its (possibly merged) issue.
export {
  getMergedArchiveMonths as getCachedArchiveMonths,
  getIssue as getCachedIssue,
} from "@/lib/issues/merged-issues";

export { getDefaultMonthWithFallback as getCachedDefaultMonth } from "@/lib/settings";
