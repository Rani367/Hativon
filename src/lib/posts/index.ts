/**
 * Post management module
 *
 * This module provides a complete API for managing school newspaper posts including:
 * - CRUD operations (create, read, update, delete)
 * - Query functions (get posts, filter by author, search by ID)
 * - Permission checking (who can edit/delete posts)
 * - Utility functions (description extraction)
 *
 * All exports are organized into focused submodules for maintainability.
 */

// Query functions
export {
  getPosts as getAllPosts,
  getPostById,
  getPublishedPostById,
  getPostsByAuthor,
  getPostStats,
} from "./queries";

// Query types
export type { PaginationOptions, PaginatedPosts } from "./queries";

// Public API (published posts only)
export { getPosts, getPost, getWordCount } from "./posts";

// CRUD operations
export { createPost, updatePost, deletePost } from "./storage";

// Permission checking
export { canUserEditPost, canUserDeletePost } from "./permissions";

// Utility functions
export {
  generateDescription,
  rowToPost,
  MAX_DESCRIPTION_LENGTH,
} from "./utils";
