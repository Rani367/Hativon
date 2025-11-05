# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 blog application with a self-hosted admin panel, designed for **Hebrew language** content with **RTL (right-to-left) support**. Posts are managed through a web interface and stored in Vercel Blob Storage (production) or local JSON files (development).

**Language Configuration:**
- Primary language: Hebrew (`lang="he"`)
- Text direction: RTL (`dir="rtl"`)
- Locale: `he_IL`
- Custom font: Heebo (Hebrew typeface with full weight range: 100-900)

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

# Database (User Authentication)
npm run db:init      # Initialize PostgreSQL database (run once)
npm run create-admin # Create admin user account (after db:init)
```

**Note:** This project uses pnpm as the package manager (configured in package.json). You can use `pnpm` instead of `npm` for all commands.

## User Authentication System

The blog now supports multi-user authentication, allowing users to register, login, and manage their own posts.

### User Roles

1. **Admin**: Full access to all posts, user management, and admin panel
   - Can edit/delete ANY post
   - Access to `/admin` panel
   - Can manage users via `/admin/users`
   - Legacy admin password still works for backward compatibility

2. **Regular User**: Can create and manage their own posts
   - Can only edit/delete their own posts
   - Access to `/dashboard` for personal post management
   - Can register via the "הרשם" (Register) button in navbar

### Getting Started with User Auth

**Option 1: Using Database (Recommended for Production)**
1. Enable Vercel Postgres in your Vercel dashboard (or set up local Postgres)
2. Set environment variables in `.env.local`:
   ```
   POSTGRES_URL=your_postgres_connection_string
   JWT_SECRET=generate_with_openssl_rand_base64_32
   ```
3. Initialize database: `npm run db:init`
4. Create admin user: `npm run create-admin`
5. Users can now register at the site via the login button

**Option 2: Legacy Admin Only (No Database Required)**
- If `POSTGRES_URL` is not set, the system falls back to legacy admin password authentication
- Only admin access is available (no user registration)
- Uses simple cookie authentication

### User Features

**Public Users (Not Logged In):**
- Browse published posts
- Click "התחבר" (Login) button to login or register

**Logged-In Users:**
- Create new posts via "פוסט חדש" menu item
- View "הפוסטים שלי" (My Posts) dashboard
- Edit/delete only their own posts
- Posts are automatically linked to their account

**Admins:**
- All regular user features
- Full access to admin panel
- Can edit/delete ANY post
- User management interface
- View all posts regardless of author

### Authentication Flow

1. User clicks "התחבר" (Login) button in navbar
2. Dialog opens with login/register tabs
3. After successful login/registration, user menu appears showing:
   - User's display name
   - Link to dashboard ("הפוסטים שלי" or "לוח בקרה מנהל")
   - Create post option
   - Logout button

### Admin Panel

Access the admin panel at `/admin`:

1. **Login**: Enter your admin password (set in `.env.local` as `ADMIN_PASSWORD`)
   - Or use admin user account credentials if database is set up
2. **Dashboard**: View statistics and recent posts
3. **All Posts**: Manage all blog posts (published and drafts)
4. **Create Post**: Write new blog posts in Markdown
5. **Edit Post**: Update existing posts
6. **Users** (new): Manage user accounts (admin only)

The admin panel uses JWT-based authentication with 7-day sessions (configurable via `SESSION_DURATION`).

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
- [src/lib/posts-storage.ts](src/lib/posts-storage.ts): CRUD operations for posts with permission checks
- [src/lib/posts.ts](src/lib/posts.ts): Public API for reading published posts
- [src/types/post.types.ts](src/types/post.types.ts): TypeScript interfaces for posts (includes `authorId`)

**User Authentication:**
- [src/lib/users.ts](src/lib/users.ts): User CRUD operations, password validation
- [src/lib/auth/jwt.ts](src/lib/auth/jwt.ts): JWT token generation and verification
- [src/lib/auth/middleware.ts](src/lib/auth/middleware.ts): Authentication middleware (requireAuth, requireAdmin)
- [src/lib/db/client.ts](src/lib/db/client.ts): PostgreSQL database client
- [src/lib/db/schema.sql](src/lib/db/schema.sql): Database schema for users table
- [src/lib/db/init.ts](src/lib/db/init.ts): Database initialization functions
- [src/types/user.types.ts](src/types/user.types.ts): TypeScript interfaces for users

**Auth Components:**
- [src/components/auth/auth-provider.tsx](src/components/auth/auth-provider.tsx): React context for authentication state
- [src/components/auth/login-form.tsx](src/components/auth/login-form.tsx): Login form with Hebrew labels
- [src/components/auth/register-form.tsx](src/components/auth/register-form.tsx): Registration form with Hebrew labels
- [src/components/auth/auth-dialog.tsx](src/components/auth/auth-dialog.tsx): Modal dialog with login/register tabs
- [src/components/auth/user-menu.tsx](src/components/auth/user-menu.tsx): User menu dropdown in navbar

**Admin Panel:**
- [src/app/admin/page.tsx](src/app/admin/page.tsx): Admin login page
- [src/app/admin/dashboard/page.tsx](src/app/admin/dashboard/page.tsx): Admin dashboard with stats
- [src/app/admin/posts/page.tsx](src/app/admin/posts/page.tsx): Posts list and management
- [src/app/admin/posts/new/page.tsx](src/app/admin/posts/new/page.tsx): Create new post
- [src/app/admin/posts/[id]/page.tsx](src/app/admin/posts/[id]/page.tsx): Edit existing post

**API Routes - Authentication:**
- [src/app/api/authenticate/route.ts](src/app/api/authenticate/route.ts): Legacy admin password auth (upgraded to JWT)
- [src/app/api/check-auth/route.ts](src/app/api/check-auth/route.ts): Session validation (JWT + legacy)
- [src/app/api/logout/route.ts](src/app/api/logout/route.ts): Logout (legacy, still works)
- [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts): User registration
- [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts): User login
- [src/app/api/auth/logout/route.ts](src/app/api/auth/logout/route.ts): User logout
- [src/app/api/auth/session/route.ts](src/app/api/auth/session/route.ts): Check session status

**API Routes - Posts:**
- [src/app/api/admin/posts/route.ts](src/app/api/admin/posts/route.ts): Get/create posts (with permission checks)
- [src/app/api/admin/posts/[id]/route.ts](src/app/api/admin/posts/[id]/route.ts): Update/delete posts (owner or admin only)
- [src/app/api/admin/posts/export/route.ts](src/app/api/admin/posts/export/route.ts): Export posts data

**API Routes - User Management:**
- [src/app/api/admin/users/route.ts](src/app/api/admin/users/route.ts): List all users (admin only)
- [src/app/api/admin/users/[id]/route.ts](src/app/api/admin/users/[id]/route.ts): Update/delete users (admin only)

**Blog Pages:**
- [src/app/page.tsx](src/app/page.tsx): Homepage with post grid
- [src/app/posts/[slug]/page.tsx](src/app/posts/[slug]/page.tsx): Dynamic post page with SEO
- [src/components/mdx-component.tsx](src/components/mdx-component.tsx): Custom Markdown components

## Environment Variables

Required in `.env.local`:

```bash
# Admin Panel (legacy - still required for super admin access)
ADMIN_PASSWORD=your_secure_password_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Vercel Blob Storage (auto-set in production)
BLOB_READ_WRITE_TOKEN=    # Auto-generated by Vercel (don't set manually)

# Vercel Postgres (auto-set in production when you enable Postgres)
POSTGRES_URL=             # Auto-generated by Vercel (or your local Postgres connection string)
POSTGRES_URL_NON_POOLING= # Auto-generated by Vercel

# JWT Authentication (required for user authentication)
JWT_SECRET=your_jwt_secret_here_min_32_chars  # Generate with: openssl rand -base64 32

# Session Duration (optional, default: 604800 = 7 days)
SESSION_DURATION=604800   # In seconds
```

**Important Notes:**
- `ADMIN_PASSWORD`: Still required for backward compatibility and emergency admin access
- `JWT_SECRET`: **Must be set** for user authentication to work (generate a strong random string)
- `POSTGRES_URL`: Required for user authentication; if not set, system falls back to legacy admin-only mode
- `BLOB_READ_WRITE_TOKEN`: Auto-set in Vercel production; leave empty for local development

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
  author?: string;         // Display name (for backward compatibility)
  authorId?: string;       // NEW: User ID reference for ownership
  tags?: string[];
  category?: string;
  status: 'draft' | 'published';
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

**New Field:**
- `authorId`: Links post to user account (UUID). Used for permission checks (users can only edit/delete their own posts, admins can edit/delete all posts).

## Tech Stack

- **Framework**: Next.js 16 with App Router (Turbopack enabled by default)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: Vercel Postgres (PostgreSQL) for user management
- **Post Storage**: Vercel Blob (production) + Local JSON (development)
- **Authentication**: JWT-based with HTTP-only cookies (no external auth service)
- **Password Hashing**: bcryptjs with 12 salt rounds
- **Markdown**: `react-markdown` with `remark-gfm` and `rehype-raw`
- **Syntax Highlighting**: `react-syntax-highlighter` with VS Code Dark+ theme
- **Package Manager**: pnpm (version 10.11.0, configured in package.json)

## Important Notes

- **User Registration**: Click "התחבר" button in navbar to login or register
- **Admin Access**: Go to `/admin` and enter your `ADMIN_PASSWORD`, or use admin user credentials
- **Session Duration**: 7 days (configurable via `SESSION_DURATION` env var)
- **Permissions**: Users can only edit/delete their own posts; admins can manage all posts
- **Auto-Generated Fields**: Slugs (from titles), descriptions (from content first 160 chars), authorId (from logged-in user)
- **Markdown Support**: Full GitHub Flavored Markdown with code syntax highlighting
- **Image Hosting**: Cover images require external URLs (upload to Vercel Blob, Cloudinary, etc.)
- **Draft vs Published**: Only published posts appear on the public blog
- **Hebrew & RTL**: The site is configured for Hebrew content with RTL layout. When adding UI elements, ensure proper RTL support using Tailwind's `rtl:` and `ltr:` modifiers
- **Database Optional**: System works without database (legacy admin mode), but user authentication requires Postgres
- **README Discrepancy**: The README.md describes a Notion-powered blog but this codebase uses a self-hosted admin panel. The CLAUDE.md (this file) reflects the actual implementation.

## Deployment to Vercel

### Initial Setup

1. Push your code to GitHub
2. Connect repository to Vercel
3. **Enable Vercel Postgres** in the Storage tab of your Vercel dashboard
4. Set environment variables in Vercel dashboard:
   - `ADMIN_PASSWORD`: Your secure admin password
   - `NEXT_PUBLIC_SITE_URL`: Your production URL (e.g., `https://yourdomain.com`)
   - `JWT_SECRET`: Strong random string (generate with `openssl rand -base64 32`)
   - `SESSION_DURATION`: Optional, defaults to 604800 (7 days)
   - `BLOB_READ_WRITE_TOKEN`: Auto-generated by Vercel Blob (don't set manually)
   - `POSTGRES_URL`: Auto-generated when you enable Postgres (don't set manually)
   - `POSTGRES_URL_NON_POOLING`: Auto-generated when you enable Postgres (don't set manually)

### Post-Deployment Setup

5. After first deployment, run database initialization:
   - Option A: Use Vercel CLI locally with production database
   - Option B: Add a temporary API route that calls `initializeDatabase()` and visit it once
   - Option C: Connect to Vercel Postgres directly and run the SQL from `src/lib/db/schema.sql`

6. Create initial admin user:
   - Use the admin creation script locally (connecting to production database)
   - Or login with `ADMIN_PASSWORD` at `/admin` (will auto-create admin user on first login)

7. Test the deployment:
   - Visit `yourdomain.com/admin` - admin panel should work
   - Click "התחבר" button - user registration/login should work
   - Create a test post as a regular user

### User Access

- **Admin panel**: `yourdomain.com/admin` (requires admin password or admin user credentials)
- **User registration**: Click "התחבר" button in navbar on any page
- **User dashboard**: Logged-in users see "הפוסטים שלי" in their menu
