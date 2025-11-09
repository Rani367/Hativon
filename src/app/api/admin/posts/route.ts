import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPosts, createPost, getPostStats, getPostsByAuthor } from '@/lib/posts-storage';
import { PostInput } from '@/types/post.types';
import { getCurrentUser } from '@/lib/auth/middleware';
import { isAdminAuthenticated } from '@/lib/auth/admin';

// GET /api/admin/posts - Get all posts (admin) or user's posts (regular user)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    const isAdmin = await isAdminAuthenticated();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const includeStats = searchParams.get('stats') === 'true';

    let posts;

    // Admin sees all posts, regular user sees only their own
    if (isAdmin) {
      posts = await getPosts(false); // Get all posts (including drafts)
    } else {
      posts = await getPostsByAuthor(user.id);
    }

    // Filter by status
    if (status && (status === 'published' || status === 'draft')) {
      posts = posts.filter(post => post.status === status);
    }

    // Search by title
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.slug.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: any = { posts };

    // Include stats if requested
    if (includeStats) {
      response.stats = await getPostStats();
    }

    // Disable caching for instant updates
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PostInput = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Add authorId, grade, and class from authenticated user
    body.authorId = user.id;
    // Also set author display name if not provided
    if (!body.author) {
      body.author = user.displayName;
    }
    // Set author grade and class
    body.authorGrade = user.grade;
    body.authorClass = user.classNumber;

    const newPost = await createPost(body);

    // Revalidate all pages to show the new post immediately
    revalidatePath('/', 'layout');

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
