# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL RULE: NO EMOJIS

**NEVER use emojis in any code, comments, console output, or documentation.**

This is a strict project requirement. Instead:
- Use text prefixes: `[OK]`, `[ERROR]`, `[WARNING]`, `[INFO]`, `[SETUP]`, etc.
- Keep output professional and emoji-free
- This applies to ALL files: TypeScript, JavaScript, Markdown, scripts, everything

**Examples of what NOT to do:**
- WRONG: `console.log('(emoji) Success!')`
- WRONG: `console.log('(emoji) Warning!')`
- WRONG: `## (emoji) Getting Started`

**Examples of correct output:**
- CORRECT: `console.log('[OK] Success!')`
- CORRECT: `console.log('[WARNING] Warning!')`
- CORRECT: `## Getting Started`

## Commit Message Guidelines

**After completing a logical chunk of work, provide a single concise commit message in imperative mood.**

Examples:
- CORRECT: "Reorganize components into feature folders"
- CORRECT: "Add user authentication middleware"
- CORRECT: "Fix responsive layout on mobile devices"
- WRONG: "Reorganized components" (past tense)
- WRONG: "Adding auth" (gerund/continuous)
- WRONG: "WIP" or "Various changes" (not descriptive)

## Project Overview

A Next.js 16 school newspaper blog application with Hebrew/RTL support, featuring multi-user authentication, role-based access control, and dual-mode operation (database-backed or admin-only).

**Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, PostgreSQL (Vercel Postgres), Vercel Blob, JWT authentication

## Essential Commands

### Development
```bash
pnpm install              # ONE-COMMAND SETUP - Automatically configures everything:
                          # - Creates .env.local with secure JWT secret
                          # - Detects PostgreSQL and creates database
                          # - Initializes schema and creates test user
                          # - Falls back to admin-only mode if no PostgreSQL
                          # After this, you're ready to run `pnpm run dev`
                          # Test user: username=user, password=12345678
                          # Admin panel: /admin with ADMIN_PASSWORD from .env.local

pnpm run dev              # Start dev server (no validation, starts immediately)
pnpm run build            # Production build
pnpm run lint             # ESLint check
```

### Manual Database Setup (if needed)
```bash
pnpm run setup            # Interactive setup with PostgreSQL configuration
pnpm run db:init          # Initialize database schema (runs src/lib/db/schema.sql)
pnpm run create-test-user # Create test user (username: user, password: 12345678)

# Note: Admin panel access uses ADMIN_PASSWORD from .env.local, NOT user accounts
```

### Deployment
```bash
pnpm run validate         # Run comprehensive validation (all checks below)
pnpm run pre-deploy       # Run comprehensive validation + build + git commit
                          # This is EXTREMELY thorough - catches ALL errors
                          # NO ERROR should make it to production
git push                  # After pre-deploy, push to trigger Vercel deployment
```

**What `pnpm run validate` checks (100+ checks):**
1. **TypeScript**: Strict compilation, type safety, no 'any' in critical files
2. **ESLint**: Zero errors, zero warnings allowed
3. **Security**: No exposed secrets, no dangerous patterns, dependency vulnerabilities
4. **Imports**: Circular dependencies, unused dependencies, missing imports
5. **Database**: Schema validation, connection test (if configured)
6. **Configuration**: package.json, tsconfig.json, next.config.ts, .env.example
7. **Runtime**: API route structure, module resolution, debug statements
8. **Dependencies**: Version pinning, peer dependencies, no pre-release versions
9. **Code Quality**: TODOs in critical paths, error handling, naming conventions
10. **Build Size**: Bundle size, large chunks detection

## Architecture

### Authentication System

The app has TWO SEPARATE authentication systems:

#### 1. User Authentication (Regular Users)
**Requires `POSTGRES_URL`** for database-backed user accounts:
- Multi-user support with registration/login at homepage
- JWT-based sessions stored in HTTP-only cookies
- Users stored in PostgreSQL `users` table
- All users are regular users with equal permissions (ownership-based)
- Test user auto-created: username=`user`, password=`12345678`

**Without `POSTGRES_URL`** (admin-only mode):
- No user registration/login available
- Posts stored in `data/posts.json` (local file)
- Mock admin user with ID `'legacy-admin'` (see `src/lib/auth/middleware.ts:27-40`)

#### 2. Admin Panel Authentication (Separate System)
**IMPORTANT**: Admin panel access is COMPLETELY INDEPENDENT of user accounts.
- Accessed at `/admin` route
- Uses `ADMIN_PASSWORD` from `.env.local` (default: `admin123`)
- Simple password-based authentication (no username)
- Stored in separate cookie `adminAuth`
- Anyone with this password can access the admin panel
- **No connection to the users table** - not a user account!

### Database Abstraction Layer

**Key File**: `src/lib/db/client.ts`

The database client automatically adapts to environment:
- **Production (Vercel)**: Uses `@vercel/postgres` with WebSocket connection
- **Local Development**: Uses standard `pg` Pool with `POSTGRES_URL`

```typescript
// Usage: Always use the db wrapper, never import sql directly
import { db } from '@/lib/db/client';

const result = await db.query`SELECT * FROM posts WHERE id = ${id}`;
```

**Important**: All database queries use template literal syntax. The `db.query` wrapper converts this to parameterized queries automatically.

### Post Storage Architecture

**Key Files**:
- `src/lib/posts-storage.ts` - CRUD operations, always queries PostgreSQL
- `src/lib/posts.ts` - Public API for fetching posts (read-only)

**Database Table**: `posts` (see `src/lib/db/schema.sql:16-33`)

All post operations go through PostgreSQL. The legacy `data/posts.json` is only used as fallback in admin-only mode.

**Important Functions**:
- `canUserEditPost(userId, postId, isAdmin)` - Authorization check (src/lib/posts-storage.ts:278)
- `canUserDeletePost(userId, postId, isAdmin)` - Authorization check (src/lib/posts-storage.ts:296)
- `getPostsByAuthor(authorId)` - Filter posts by author (src/lib/posts-storage.ts:313)

### User Authentication Flow

**Key Files**:
- `src/lib/auth/jwt.ts` - JWT token generation/verification
- `src/lib/auth/middleware.ts` - `getCurrentUser()`, `requireAuth()`, `isAuthenticated()`
- `src/lib/users.ts` - User CRUD operations

**Authentication Flow**:
1. User logs in → `/api/auth/login` validates credentials
2. JWT token generated with `{userId, username}` payload
3. Token stored in HTTP-only cookie named `authToken`
4. `getCurrentUser()` verifies token and fetches fresh user data from database
5. Special case: `userId === 'legacy-admin'` returns mock admin user (src/lib/auth/middleware.ts:27-40)

**Session Management**:
- Default session duration: 7 days (configurable via `SESSION_DURATION` env var)
- Tokens contain `exp` (expiration) claim
- No refresh token mechanism - user must re-login after expiration

### User Permissions & Authorization

**Roles**: All users are equal; authorization is based on resource ownership only.

**Permission Model**:
- **All Users**: Can only edit/delete their own posts (matched by `authorId`)
- **Post Ownership**: Determined by `post.authorId === user.id`
- **Admin Panel Users**: Anyone authenticated with `ADMIN_PASSWORD` has full access to all posts and users (this is NOT a user account - it's the admin panel authentication)

**Important**: When checking permissions, always use:
```typescript
import { canUserEditPost, canUserDeletePost } from '@/lib/posts-storage';

// isAdmin refers to ADMIN_PASSWORD authentication, not a user role
const canEdit = await canUserEditPost(userId, postId, isAdmin);
```

**Note**: The `isAdmin` parameter refers to admin panel authentication (via `ADMIN_PASSWORD`), NOT a user account role. There are no admin user accounts - only regular users.

### API Route Structure

All API routes follow Next.js 16 App Router conventions (`src/app/api/`):

**Public APIs**:
- `/api/auth/login` - User login (POST)
- `/api/auth/register` - User registration (POST)
- `/api/auth/session` - Get current session (GET)
- `/api/auth/logout` - Logout (POST)
- `/api/check-auth` - Check authentication status (GET)

**Protected APIs** (require user authentication):
- `/api/user/profile` - User profile management (GET, PATCH)
- `/api/upload` - Image upload to Vercel Blob (POST)

**Admin Panel APIs** (require `ADMIN_PASSWORD` authentication):
- `/api/admin/verify-password` - Verify admin panel password (POST)
- `/api/admin/logout` - Logout from admin panel (POST)
- `/api/admin/posts` - Post management (GET, POST)
- `/api/admin/posts/[id]` - Single post operations (GET, PUT, DELETE)
- `/api/admin/users` - User management (GET, POST)
- `/api/admin/users/[id]` - Single user operations (GET, PUT, DELETE)

**Important**: `/api/admin/*` routes use admin panel authentication (ADMIN_PASSWORD), NOT user account authentication. These are two separate systems.

### Type System

**Key Files**: `src/types/`

**Core Types**:
```typescript
// User types (src/types/user.types.ts)
type Grade = 'ז' | 'ח' | 'ט' | 'י';  // Hebrew grades 7-10

interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  grade: Grade;
  classNumber: number;  // 1-4
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// Post types (src/types/post.types.ts)
interface Post {
  id: string;
  title: string;
  slug: string;          // Auto-generated from title
  content: string;       // Markdown content
  coverImage?: string;   // Vercel Blob URL
  description: string;   // Auto-generated from content (160 chars)
  date: string;          // Publication date
  author?: string;       // Display name
  authorId?: string;     // User ID for ownership
  authorGrade?: string;  // Author's grade (ז, ח, ט, י)
  authorClass?: number;  // Author's class (1-4)
  tags?: string[];
  category?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}
```

### Image Upload & Storage

**Image handling uses Vercel Blob in production, falls back to base64 data URLs in development**

**Upload Flow**:
1. Client uploads image to `/api/upload`
2. API checks for `BLOB_READ_WRITE_TOKEN`
3. If available: uploads to Vercel Blob, returns public URL
4. If not available (local dev): returns base64 data URL

**Important**: Always store image URLs in `coverImage` field, not file paths.

## Critical Implementation Details

### Hebrew/RTL Support

The entire UI is configured for Hebrew (RTL) text:
- Primary font: Heebo (loaded via Google Fonts)
- `dir="rtl"` set on `<html>` element
- Tailwind configured for RTL
- All UI text should be in Hebrew
- Use logical properties (`ms-`, `me-`, `start`, `end`) instead of directional (`ml-`, `mr-`, `left`, `right`)

### Responsive Design

The application is fully optimized for all screen sizes using mobile-first Tailwind breakpoints:

**Breakpoints**:
- `sm:` 640px - Small tablets and large phones
- `md:` 768px - Tablets
- `lg:` 1024px - Desktop
- `xl:` 1280px - Large desktop
- `2xl:` 1536px - Extra large screens

**Key Responsive Features**:
- **Header Navigation**: 3-column grid layout, responsive logo sizing, mobile-friendly button text
- **Sidebars** (Dashboard/Admin): Fixed mobile overlay with proper z-index stacking (sidebar z-60, overlay z-50, header z-50)
- **Hero Section**: Responsive heights from 350px (mobile) to 700px (xl)
- **Post Grid**: 1 column (mobile) → 2 (tablet) → 3 (desktop) → 4 (2xl)
- **Forms**: Responsive textarea heights, stacked inputs on mobile
- **Tables**: Responsive padding, larger touch targets on mobile, hidden columns on small screens
- **Cards**: Adjusted metadata visibility, responsive spacing

**Important Z-Index Hierarchy**:
- Mobile sidebar: `z-[60]` (appears on top)
- Overlay: `z-50` (covers header when sidebar open)
- Sticky header: `z-50` (normal sticky behavior)

### Slug Generation

Slugs are auto-generated from post titles (src/lib/posts-storage.ts:8-13):
```typescript
// Converts: "כותרת הפוסט שלי" → "כותרת-הפוסט-שלי"
// Lowercased, non-alphanumeric chars replaced with hyphens
```

**Important**: Slugs must be unique. When updating a post title, the slug is regenerated.

### Auto-generated Fields

When creating/updating posts, these fields are auto-generated:
- `slug` - from title (src/lib/posts-storage.ts:126)
- `description` - first 160 chars of content, stripped of markdown (src/lib/posts-storage.ts:127)
- `id` - UUID v4 for new posts (src/lib/posts-storage.ts:124)

### Password Hashing

**Always use bcrypt** for password operations:
```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const valid = await bcrypt.compare(password, hash);
```

**Important**: Never store plain-text passwords. Always hash before storing in database.

### Environment Variable Validation

The `pnpm run pre-deploy` command validates:
- `ADMIN_PASSWORD` exists and is strong (min 8 chars recommended)
- `JWT_SECRET` is at least 32 characters
- `NEXT_PUBLIC_SITE_URL` is a valid URL
- `SESSION_DURATION` is reasonable (if set)
- Warns if `POSTGRES_URL` missing (not required, enables database mode)

**Files**: `scripts/validate-env.ts`, `scripts/validate-build.ts`

### Database Schema Updates

When modifying database schema:
1. Update `src/lib/db/schema.sql`
2. Create migration script in `scripts/migrate-*.ts`
3. Run migration locally: `tsx scripts/migrate-*.ts`
4. Test thoroughly before deploying

**Example migration**: `scripts/migrate-add-grade.ts` (adds grade column to posts)

## Development Workflows

### Adding a New API Route

1. Create route file: `src/app/api/[route]/route.ts`
2. Export HTTP method handlers: `export async function GET/POST/PUT/DELETE(request: Request)`
3. For protected routes, add authentication:
   ```typescript
   import { getCurrentUser } from '@/lib/auth/middleware';

   export async function POST(request: Request) {
     const user = await getCurrentUser();
     if (!user) {
       return Response.json({ error: 'Unauthorized' }, { status: 401 });
     }
     // ... rest of handler
   }
   ```

### Adding a New Post Feature

1. Update `Post` and `PostInput` types in `src/types/post.types.ts`
2. Update database schema in `src/lib/db/schema.sql`
3. Create migration script in `scripts/`
4. Update `createPost()` and `updatePost()` in `src/lib/posts-storage.ts`
5. Update post forms in `src/app/dashboard/posts/` and `src/app/admin/posts/`

### Testing Database Changes Locally

```bash
# 1. Ensure local PostgreSQL is running
psql -h localhost -U postgres

# 2. Update schema or create migration
# Edit: src/lib/db/schema.sql or scripts/migrate-*.ts

# 3. Run migration
tsx scripts/migrate-your-change.ts

# 4. Verify changes
psql -h localhost -U postgres -d school_newspaper
\d posts  # Show table structure
```

## Common Gotchas

### 1. Database Connection in Development

If you see "Database connection not configured" errors:
- Check `.env.local` has `POSTGRES_URL` set
- Verify PostgreSQL is running: `psql -h localhost -U postgres`
- Try running `pnpm run setup` for interactive configuration

### 2. JWT Token Errors

"JWT malformed" or "Invalid token":
- Check `JWT_SECRET` is set in `.env.local`
- Ensure `JWT_SECRET` is at least 32 characters
- Clear browser cookies and re-login

### 3. Legacy Admin Mode vs Database Mode

The system automatically falls back to legacy admin mode when:
- `POSTGRES_URL` is not set OR
- Database connection fails

Check mode by looking at console logs on startup. Database mode will log connection status.

### 4. Image Uploads in Development

In local development without `BLOB_READ_WRITE_TOKEN`:
- Images are converted to base64 data URLs
- This works but creates large URLs in database
- For production-like testing, set up Vercel Blob locally

### 5. Vercel-Specific Configuration

The project uses `vercel.json` to customize build:
- Build command runs validation before build
- Environment variables are automatically injected
- Don't modify `vercel.json` unless necessary

### 6. Post Build Deployment Script

`scripts/post-build-deploy.ts` runs after build to:
- Show git status
- Prompt for commit message
- Stage and commit changes
- Automatically skips in CI/CD environments

**Important**: This is part of `pnpm run pre-deploy` workflow. It does NOT push to remote - you must run `git push` manually.

### 7. Vercel Console Output Interpretation

**CRITICAL**: Vercel's build system scans console output for error-like patterns and treats them as build failures, even when they're just informational messages.

**Avoid these keywords in console.log messages:**
- "error" (use "issue", "problem", or "validation failure" instead)
- "fail" in standalone context (use "validation did not pass" or describe what's wrong)
- "checking error" (use "validating exception handling" or "checking exceptions")
- Any phrase containing "No error should..." (use positive phrasing like "ensuring quality")

**Bad examples:**
```typescript
console.log('Checking error handling...');           // Triggers false positive
console.log('No error should make it to production!'); // Triggers false positive
console.log('[ERROR] Something went wrong');         // Only use for actual errors
```

**Good examples:**
```typescript
console.log('Validating API exception handling...'); // Clear and safe
console.log('Ensuring production-ready code quality'); // Positive phrasing
console.log('[FAIL] Validation failed');             // Use when actually failing
```

**When writing validation/build scripts:**
1. Use descriptive progress messages that don't contain trigger words
2. Reserve "error" and "fail" keywords for actual error reporting
3. Use positive phrasing for informational messages
4. Test locally with `pnpm run validate` before pushing to Vercel

## Scripts Reference

All utility scripts are in `scripts/`:

| Script | Purpose |
|--------|---------|
| `postinstall.ts` | Auto-setup on `pnpm install` (creates .env.local, configures DB, creates test user) |
| `setup.ts` | Interactive setup with database configuration |
| `init-db.ts` | Initialize database schema (runs schema.sql) |
| `create-test-user-simple.ts` | Create test user (username: user, password: 12345678) |
| `create-test-user.ts` | Interactive test user creation |
| `check-db.ts` | Check database connection and status |
| `validate-env.ts` | Validate environment variables |
| `validate-build.ts` | Validate build configuration |
| `post-build-deploy.ts` | Git commit workflow (interactive) |
| `migrate-*.ts` | Database migrations |

**Note**: There are no "create-admin" scripts because admin panel uses `ADMIN_PASSWORD` from `.env.local`, not user accounts.

## Deployment Process

### Pre-Deployment Checklist

1. Run validation: `pnpm run pre-deploy`
2. Fix any errors reported
3. Review and commit changes
4. Push to GitHub: `git push`
5. Vercel auto-deploys on push to main

### Post-Deployment Setup (First Time)

After first Vercel deployment:

```bash
# 1. Initialize database
pnpm run db:init

# 2. (Optional) Create test user for testing
pnpm run create-test-user

# 3. Test admin panel at yourdomain.com/admin
#    Use ADMIN_PASSWORD from environment variables
```

**Note**: Admin panel access uses `ADMIN_PASSWORD` environment variable, NOT a user account. Set this in Vercel dashboard.

### Environment Variables in Vercel

Required in Vercel dashboard:
- `ADMIN_PASSWORD` - Password for admin panel access at `/admin` (not a user account)
- `JWT_SECRET` - Generated via `openssl rand -base64 32` (for user JWT tokens)
- `NEXT_PUBLIC_SITE_URL` - Your production domain (https://...)

Auto-configured by Vercel (don't set manually):
- `POSTGRES_URL` - Set when enabling Vercel Postgres (enables user authentication)
- `BLOB_READ_WRITE_TOKEN` - Set when enabling Vercel Blob (for image uploads)

**Important**: `ADMIN_PASSWORD` is for the admin panel at `/admin`, completely separate from user accounts. Users register and login through the homepage.

## Additional Notes

- The project uses pnpm as package manager (not npm or yarn)
- All timestamps are stored in UTC, displayed in user's local timezone
- Post slugs must be unique (enforced by database constraint)
- Users can only have one account per username (unique constraint)
- Grade values are Hebrew characters: ז (7), ח (8), ט (9), י (10)
- Class numbers are 1-4 (validated by database constraint)
- Markdown content supports GitHub Flavored Markdown (via remark-gfm)
- Syntax highlighting in code blocks (via react-syntax-highlighter)
