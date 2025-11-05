# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 blog application with a self-hosted admin panel. Posts are managed through a web interface and stored in Vercel Blob Storage (production) or local JSON files (development).

## Development Commands

```bash
# Development
npm run dev          # Starts dev server (Turbopack is default in Next.js 16)

# Build
npm run build        # Builds for production (Turbopack is default in Next.js 16)

# Production
npm start            # Starts production server

# Lint
npm run lint         # Runs Next.js linter
```

## Admin Panel

Access the admin panel at `/admin`:

1. **Login**: Enter your admin password (set in `.env.local` as `ADMIN_PASSWORD`)
2. **Dashboard**: View statistics and recent posts
3. **All Posts**: Manage all blog posts (published and drafts)
4. **Create Post**: Write new blog posts in Markdown
5. **Edit Post**: Update existing posts

The admin panel uses cookie-based authentication with a 1-hour session.

## Architecture

### Post Storage System

The app uses a **dual storage strategy** for flexibility between development and production:

**Storage Backend:**
- **Production (Vercel)**: Posts stored in Vercel Blob Storage (`posts.json`)
- **Development (Local)**: Posts stored in local file (`data/posts.json`)

**Auto-detection:** Uses `BLOB_READ_WRITE_TOKEN` environment variable to determine environment.

### Data Flow

```
Admin Panel (Web UI)
    ↓
Admin API Routes (/api/admin/posts)
    ↓
Posts Storage (src/lib/posts-storage.ts)
    ↓
Vercel Blob (prod) or Local JSON (dev)
    ↓
Public API (src/lib/posts.ts)
    ↓
Blog Pages (src/app/page.tsx, src/app/posts/[slug]/page.tsx)
```

### Key Files

**Storage & Data:**
- [src/lib/posts-storage.ts](src/lib/posts-storage.ts): CRUD operations for posts (Vercel Blob + local JSON)
- [src/lib/posts.ts](src/lib/posts.ts): Public API for reading published posts
- [src/types/post.types.ts](src/types/post.types.ts): TypeScript interfaces for posts

**Admin Panel:**
- [src/app/admin/page.tsx](src/app/admin/page.tsx): Admin login page
- [src/app/admin/dashboard/page.tsx](src/app/admin/dashboard/page.tsx): Admin dashboard with stats
- [src/app/admin/posts/page.tsx](src/app/admin/posts/page.tsx): Posts list and management
- [src/app/admin/posts/new/page.tsx](src/app/admin/posts/new/page.tsx): Create new post
- [src/app/admin/posts/[id]/page.tsx](src/app/admin/posts/[id]/page.tsx): Edit existing post

**API Routes:**
- [src/app/api/authenticate/route.ts](src/app/api/authenticate/route.ts): Password authentication
- [src/app/api/check-auth/route.ts](src/app/api/check-auth/route.ts): Session validation
- [src/app/api/admin/posts/route.ts](src/app/api/admin/posts/route.ts): Get/create posts
- [src/app/api/admin/posts/[id]/route.ts](src/app/api/admin/posts/[id]/route.ts): Update/delete posts

**Blog Pages:**
- [src/app/page.tsx](src/app/page.tsx): Homepage with post grid
- [src/app/posts/[slug]/page.tsx](src/app/posts/[slug]/page.tsx): Dynamic post page with SEO
- [src/components/mdx-component.tsx](src/components/mdx-component.tsx): Custom Markdown components

## Environment Variables

Required in `.env.local`:

```
ADMIN_PASSWORD=           # Password for admin panel access
NEXT_PUBLIC_SITE_URL=     # Your site URL for SEO/metadata
BLOB_READ_WRITE_TOKEN=    # Vercel Blob token (auto-set in production)
```

## Post Data Model

Posts are stored with the following structure:

```typescript
{
  id: string;              // UUID
  title: string;
  slug: string;            // Auto-generated from title
  content: string;         // Markdown content
  coverImage?: string;     // Image URL
  description: string;     // Auto-generated from content
  date: string;            // ISO 8601 publish date
  author?: string;
  tags?: string[];
  category?: string;
  status: 'draft' | 'published';
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

## Tech Stack

- **Framework**: Next.js 16 with App Router (Turbopack enabled by default)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Storage**: Vercel Blob (production) + Local JSON (development)
- **Authentication**: Cookie-based sessions (no external auth service)
- **Markdown**: `react-markdown` with `remark-gfm` and `rehype-raw`
- **Syntax Highlighting**: `react-syntax-highlighter` with VS Code Dark+ theme
- **Package Manager**: npm (pnpm can also be used)

## Important Notes

- **Admin Access**: Go to `/admin` and enter your `ADMIN_PASSWORD`
- **Session Duration**: 1 hour (re-login required after expiration)
- **Auto-Generated Fields**: Slugs (from titles), descriptions (from content first 160 chars)
- **Markdown Support**: Full GitHub Flavored Markdown with code syntax highlighting
- **Image Hosting**: Cover images require external URLs (upload to Vercel Blob, Cloudinary, etc.)
- **Draft vs Published**: Only published posts appear on the public blog

## Deployment to Vercel

1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `ADMIN_PASSWORD`: Your secure admin password
   - `NEXT_PUBLIC_SITE_URL`: Your production URL
   - `BLOB_READ_WRITE_TOKEN`: Auto-generated by Vercel Blob (don't set manually)
4. Deploy! The admin panel will be available at `yourdomain.com/admin`
