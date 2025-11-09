import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/lib/posts-storage';

// GET /api/posts - Get all published posts (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Get only published posts
    const posts = await getPosts(true);

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ posts }, {
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
