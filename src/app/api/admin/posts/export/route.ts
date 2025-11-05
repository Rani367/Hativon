import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPosts } from '@/lib/posts-storage';

// Helper to check authentication
async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken');
  return authToken?.value === 'authenticated';
}

// Helper to escape CSV special characters
function escapeCSV(str: string): string {
  if (!str) return '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/admin/posts/export - Export posts as CSV
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const posts = await getPosts(false); // Get all posts

    // CSV headers
    const headers = [
      'ID',
      'Title',
      'Slug',
      'Status',
      'Category',
      'Tags',
      'Author',
      'Created At',
      'Updated At',
      'Published Date',
    ];

    // CSV rows
    const rows = posts.map(post => [
      escapeCSV(post.id),
      escapeCSV(post.title),
      escapeCSV(post.slug),
      escapeCSV(post.status),
      escapeCSV(post.category || ''),
      escapeCSV((post.tags || []).join('; ')),
      escapeCSV(post.author || ''),
      escapeCSV(post.createdAt),
      escapeCSV(post.updatedAt),
      escapeCSV(post.date),
    ]);

    // Combine headers and rows
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="posts-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting posts:', error);
    return NextResponse.json(
      { error: 'Failed to export posts' },
      { status: 500 }
    );
  }
}
