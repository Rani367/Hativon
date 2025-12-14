import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getAllPosts,
  createPost,
  getPostStats,
  getPostsByAuthor,
} from "@/lib/posts";
import type { Post } from "@/types/post.types";
import { getCurrentUser } from "@/lib/auth/middleware";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";
import { postInputSchema } from "@/lib/validation/schemas";
import { createRateLimiter, getClientIdentifier } from "@/lib/rate-limit";

// Rate limiter for listing posts: 100 requests per minute
const listRateLimiter = createRateLimiter({
  limit: 100,
  window: 60 * 1000, // 1 minute
});

// GET /api/admin/posts - Get all posts (admin) or user's posts (regular user)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await listRateLimiter.check(
      `admin-posts-list:${identifier}`,
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 },
      );
    }

    // Check authentication - Admin panel auth takes priority over user JWT auth
    const isAdmin = await isAdminAuthenticated();
    const user = await getCurrentUser();

    // Require either admin auth OR user auth
    if (!isAdmin && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const includeStats = searchParams.get("stats") === "true";
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Check if pagination is requested
    const usePagination = limit !== null || offset !== null;

    // Validate pagination parameters
    if (usePagination) {
      const limitVal = limit ? parseInt(limit, 10) : 10;
      const offsetVal = offset ? parseInt(offset, 10) : 0;

      if (isNaN(limitVal) || limitVal < 1 || limitVal > 100) {
        return NextResponse.json(
          { error: "Invalid limit - must be between 1 and 100" },
          { status: 400 },
        );
      }
      if (isNaN(offsetVal) || offsetVal < 0) {
        return NextResponse.json(
          { error: "Invalid offset - must be a non-negative number" },
          { status: 400 },
        );
      }
    }

    const paginationOptions = usePagination
      ? {
          limit: limit ? parseInt(limit, 10) : 10,
          offset: offset ? parseInt(offset, 10) : 0,
        }
      : undefined;

    let posts: Post[] = [];
    let total: number | undefined;
    let hasMore: boolean | undefined;

    // Admin sees all posts, regular user sees only their own
    if (isAdmin) {
      const result = await getAllPosts(false, paginationOptions);
      if (usePagination && typeof result === "object" && "posts" in result) {
        posts = result.posts;
        total = result.total;
        hasMore = result.hasMore;
      } else {
        posts = Array.isArray(result) ? result : [];
      }
    } else if (user) {
      posts = await getPostsByAuthor(user.id);
      // For user posts, apply manual pagination if requested
      if (usePagination && paginationOptions) {
        total = posts.length;
        posts = posts.slice(
          paginationOptions.offset,
          paginationOptions.offset + paginationOptions.limit,
        );
        hasMore = paginationOptions.offset + paginationOptions.limit < total;
      }
    } else {
      // This shouldn't happen due to auth check above, but for type safety
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter by status
    if (status && (status === "published" || status === "draft")) {
      posts = posts.filter((post) => post.status === status);
    }

    // Search by title
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.slug.toLowerCase().includes(searchLower),
      );
    }

    // Sort by date (newest first) - only if not using database pagination
    if (!usePagination || !isAdmin) {
      posts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    interface PostsResponse {
      posts: typeof posts;
      total?: number;
      limit?: number;
      offset?: number;
      hasMore?: boolean;
      stats?: Awaited<ReturnType<typeof getPostStats>>;
    }

    const response: PostsResponse = { posts };

    // Include pagination info if requested
    if (usePagination && paginationOptions) {
      response.total = total;
      response.limit = paginationOptions.limit;
      response.offset = paginationOptions.offset;
      response.hasMore = hasMore;
    }

    // Include stats if requested
    if (includeStats) {
      response.stats = await getPostStats();
    }

    // Disable caching for instant updates
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    logError("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

// POST /api/admin/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    // Check authentication - Admin panel auth takes priority over user JWT auth
    const isAdmin = await isAdminAuthenticated();
    const user = await getCurrentUser();

    // Require either admin auth OR user auth
    if (!isAdmin && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body with Zod
    const validation = postInputSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });

      return NextResponse.json(
        {
          error: "Invalid post data",
          errors,
        },
        { status: 400 },
      );
    }

    const postData = validation.data;

    // Add authorId, grade, and class from authenticated user (if available)
    if (user) {
      postData.authorId = user.id;
      // Also set author display name if not provided
      if (!postData.author) {
        postData.author = user.displayName;
      }
      // Set author grade and class
      postData.authorGrade = user.grade;
      postData.authorClass = user.classNumber;
      // Set isTeacherPost flag if user is a teacher
      postData.isTeacherPost = user.isTeacher || false;
    } else if (isAdmin) {
      // Admin creating post without user context - use provided values or defaults
      if (!postData.authorId) {
        postData.authorId = "legacy-admin";
      }
      if (!postData.author) {
        postData.author = "מנהל המערכת"; // "System Admin" in Hebrew
      }
      // Admin panel posts are also marked as teacher posts
      postData.isTeacherPost = true;
    }

    const newPost = await createPost(postData);

    // Revalidate all pages to show the new post immediately
    revalidatePath("/", "layout");

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    logError("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
