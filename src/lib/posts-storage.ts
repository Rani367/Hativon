import { Post, PostInput, PostStats } from '@/types/post.types';
import { put, head } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const BLOB_FILENAME = 'posts.json';
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'posts.json');

// Check if running on Vercel
const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN;

// In-memory cache for posts
interface PostsCache {
  data: Post[];
  timestamp: number;
}

let postsCache: PostsCache | null = null;
const CACHE_TTL = 0; // No cache - immediate updates

/**
 * Clear the posts cache (call after any write operation)
 */
function clearCache(): void {
  postsCache = null;
}

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
  return postsCache !== null && Date.now() - postsCache.timestamp < CACHE_TTL;
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate description from content (first 160 characters)
 */
function generateDescription(content: string): string {
  const plainText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/[#*_~\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText.length > 160
    ? plainText.substring(0, 160) + '...'
    : plainText;
}

/**
 * Read posts from storage (with in-memory caching)
 */
async function readPosts(): Promise<Post[]> {
  // Return cached data if valid
  if (isCacheValid() && postsCache) {
    return postsCache.data;
  }

  try {
    let posts: Post[] = [];

    if (isVercel) {
      // Read from Vercel Blob
      try {
        // Use head() to check if blob exists and get metadata
        const metadata = await head(BLOB_FILENAME);

        // Fetch the blob content using the URL from metadata with cache-busting
        const cacheBustingUrl = `${metadata.url}?t=${Date.now()}`;
        const response = await fetch(cacheBustingUrl, {
          cache: 'no-store', // Disable Next.js fetch caching
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        posts = await response.json();
        console.log('Successfully read posts from Vercel Blob:', posts.length, 'posts');
      } catch (error) {
        // Blob doesn't exist yet, return empty array
        console.log('Blob does not exist or error reading:', error);
        posts = [];
      }
    } else {
      // Read from local file
      if (!fs.existsSync(LOCAL_DATA_FILE)) {
        // Create directory and file if they don't exist
        if (!fs.existsSync(LOCAL_DATA_DIR)) {
          fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([], null, 2));
        posts = [];
      } else {
        const data = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
        posts = JSON.parse(data);
      }
    }

    // Update cache
    postsCache = {
      data: posts,
      timestamp: Date.now(),
    };

    return posts;
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
}

/**
 * Write posts to storage (clears cache after write)
 */
async function writePosts(posts: Post[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(posts, null, 2);

    if (isVercel) {
      // Write to Vercel Blob
      console.log('Writing posts to Vercel Blob:', posts.length, 'posts');
      const result = await put(BLOB_FILENAME, jsonData, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true, // Allow overwriting existing posts.json file
        cacheControlMaxAge: 0, // Disable edge caching for immediate updates
      });
      console.log('Successfully wrote posts to Vercel Blob:', result.url);
    } else {
      // Write to local file
      if (!fs.existsSync(LOCAL_DATA_DIR)) {
        fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(LOCAL_DATA_FILE, jsonData);
    }

    // Clear cache after successful write
    clearCache();
  } catch (error) {
    console.error('Error writing posts:', error);
    throw error;
  }
}

/**
 * Get all posts
 */
export async function getPosts(filterPublished = false): Promise<Post[]> {
  const posts = await readPosts();

  if (filterPublished) {
    return posts.filter(post => post.status === 'published');
  }

  return posts;
}

/**
 * Get post by ID
 */
export async function getPostById(id: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find(post => post.id === id) || null;
}

/**
 * Get post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find(post => post.slug === slug && post.status === 'published') || null;
}

/**
 * Create new post
 */
export async function createPost(input: PostInput): Promise<Post> {
  const posts = await readPosts();

  const now = new Date().toISOString();
  const slug = generateSlug(input.title);
  const description = generateDescription(input.content);

  const newPost: Post = {
    id: uuidv4(),
    title: input.title,
    slug,
    content: input.content,
    coverImage: input.coverImage,
    description,
    date: now,
    author: input.author,
    authorId: input.authorId,
    tags: input.tags || [],
    category: input.category,
    status: input.status || 'draft',
    createdAt: now,
    updatedAt: now,
  };

  posts.unshift(newPost); // Add to beginning
  await writePosts(posts);

  return newPost;
}

/**
 * Update existing post
 */
export async function updatePost(id: string, input: Partial<PostInput>): Promise<Post | null> {
  const posts = await readPosts();
  const index = posts.findIndex(post => post.id === id);

  if (index === -1) {
    return null;
  }

  const updatedPost = { ...posts[index] };

  if (input.title) {
    updatedPost.title = input.title;
    updatedPost.slug = generateSlug(input.title);
  }
  if (input.content !== undefined) {
    updatedPost.content = input.content;
    updatedPost.description = generateDescription(input.content);
  }
  if (input.coverImage !== undefined) updatedPost.coverImage = input.coverImage;
  if (input.author !== undefined) updatedPost.author = input.author;
  if (input.authorId !== undefined) updatedPost.authorId = input.authorId;
  if (input.tags !== undefined) updatedPost.tags = input.tags;
  if (input.category !== undefined) updatedPost.category = input.category;
  if (input.status !== undefined) updatedPost.status = input.status;

  updatedPost.updatedAt = new Date().toISOString();

  posts[index] = updatedPost;
  await writePosts(posts);

  return updatedPost;
}

/**
 * Delete post
 */
export async function deletePost(id: string): Promise<boolean> {
  const posts = await readPosts();
  const filteredPosts = posts.filter(post => post.id !== id);

  if (filteredPosts.length === posts.length) {
    return false; // Post not found
  }

  await writePosts(filteredPosts);
  return true;
}

/**
 * Get post statistics
 */
export async function getPostStats(): Promise<PostStats> {
  const posts = await readPosts();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    drafts: posts.filter(p => p.status === 'draft').length,
    today: posts.filter(p => new Date(p.createdAt) >= todayStart).length,
    thisWeek: posts.filter(p => new Date(p.createdAt) >= weekStart).length,
    thisMonth: posts.filter(p => new Date(p.createdAt) >= monthStart).length,
  };
}

/**
 * Check if user can edit a post
 * Admin can edit all posts, regular users can only edit their own posts
 */
export async function canUserEditPost(userId: string, postId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) {
    return true; // Admin can edit all posts
  }

  const post = await getPostById(postId);
  if (!post) {
    return false;
  }

  // User can edit if they are the author
  return post.authorId === userId;
}

/**
 * Check if user can delete a post
 * Admin can delete all posts, regular users can only delete their own posts
 */
export async function canUserDeletePost(userId: string, postId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) {
    return true; // Admin can delete all posts
  }

  const post = await getPostById(postId);
  if (!post) {
    return false;
  }

  // User can delete if they are the author
  return post.authorId === userId;
}

/**
 * Get posts by author ID
 */
export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  const posts = await readPosts();
  return posts.filter(post => post.authorId === authorId);
}
