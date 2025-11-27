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

## CRITICAL RULE: TypeScript Type Safety

**NEVER use the 'any' type in TypeScript code.**

This is a strict project requirement for maintaining type safety:
- Use proper TypeScript types instead of `any`
- For error handling: Use `catch (error)` instead of `catch (error: any)`
- Access error properties safely: `error instanceof Error ? error.message : String(error)`
- For unknown types: Use `unknown` and narrow with type guards
- For generic objects: Define proper interfaces or use `Record<string, T>`
- For function parameters: Define explicit parameter types

**Examples of what NOT to do:**
- WRONG: `catch (error: any) { console.log(error.message); }`
- WRONG: `const data: any = await response.json();`
- WRONG: `function process(data: any) { ... }`
- WRONG: `interface Props { [key: string]: any; }`

**Examples of correct patterns:**
- CORRECT: `catch (error) { const message = error instanceof Error ? error.message : String(error); }`
- CORRECT: `const data: UserData = await response.json();`
- CORRECT: `function process(data: ProcessInput) { ... }`
- CORRECT: `interface Props extends React.HTMLAttributes<HTMLDivElement> { ... }`

**The only acceptable use of 'any':**
- In test files when mocking complex external dependencies
- When explicitly required by third-party library types (very rare)

## CRITICAL RULE: Git Workflow

**NEVER commit directly using `git commit`. NEVER push to GitHub.**

**ONLY use `pnpm run pre-deploy` to commit changes.**

This command:
1. Runs all tests (162 tests must pass)
2. Runs comprehensive validation (100+ checks)
3. Runs production build
4. Prompts for commit message (if all above pass)
5. Creates the commit

**The user will push to GitHub manually. DO NOT run `git push`.**

## CRITICAL RULE: File Size Limit

**NO file should exceed 500 lines of code.**

This is a strict project requirement for maintainability:
- All TypeScript/JavaScript files must be under 500 lines
- If a file exceeds 500 lines, refactor it into smaller modules
- Extract logical components, functions, or sections into separate files
- Use barrel exports (index.ts) to maintain clean import paths
- The validation system automatically checks and fails on files over 500 lines

**Why this matters:**
- Large files are hard to read, understand, and maintain
- Smaller files encourage better separation of concerns
- Easier code review and debugging
- Reduces merge conflicts
- Forces thoughtful architecture

**How to refactor large files:**
1. Identify logical sections or related functionality
2. Extract into separate files in a subdirectory
3. Create an index.ts barrel export if needed
4. Update imports to use the new structure
5. Verify all functionality is preserved

**Examples:**
- WRONG: A 1500-line validation script in one file
- CORRECT: Split into 10+ modules (typescript.ts, eslint.ts, security.ts, etc.)
- WRONG: A 700-line React component
- CORRECT: Extract sub-components, hooks, and utilities into separate files
- WRONG: A 600-line API route handler
- CORRECT: Split into route handler, validation, business logic, and data access layers

**The validation check:**
- Runs automatically in `pnpm run validate`
- Scans all .ts, .tsx, .js, .jsx files in src/ and scripts/
- Fails as CRITICAL error if any file exceeds 500 lines
- Shows list of offending files with line counts

## CRITICAL RULE: Never Edit Validation/Tests Without Permission

**NEVER modify validation scripts, tests, or checks unless explicitly instructed to do so.**

This includes:
- Files in `scripts/` directory (especially `validate-*.ts`, `check-*.ts`)
- Test files (`*.test.ts`, `*.spec.ts`)
- ESLint configuration (`.eslintrc.json`, `eslint.config.*`)
- TypeScript configuration (`tsconfig.json`)
- Build validation logic

**Why this matters:**
- Editing checks to make them pass is HIDING problems, not fixing them
- This is a form of technical debt that leads to production bugs
- The validation system exists to catch real issues - respect it

**If validation fails:**
1. Fix the actual code that's causing the failure
2. Do NOT weaken or remove the check
3. If you believe a check is wrong, ask the user first
4. Document why a check might need adjustment

**Examples of what NOT to do:**
- WRONG: Removing a TypeScript strict check because code doesn't compile
- WRONG: Disabling an ESLint rule to silence warnings
- WRONG: Commenting out a validation step that's failing
- WRONG: Modifying test assertions to match buggy behavior
- WRONG: Increasing the 500-line limit because a file is too large

**Correct approach:**
- CORRECT: Fix the type error in the source code
- CORRECT: Refactor code to follow ESLint rules
- CORRECT: Fix the bug that's causing validation to fail
- CORRECT: Refactor large files into smaller modules
- CORRECT: Ask user if a check seems incorrect before changing it

## Commit Message Guidelines

**After completing a logical chunk of work, the user will run `pnpm run pre-deploy`.**

When prompted, provide a single concise commit message in imperative mood.

Examples:
- CORRECT: "Reorganize components into feature folders"
- CORRECT: "Add user authentication middleware"
- CORRECT: "Fix responsive layout on mobile devices"
- WRONG: "Reorganized components" (past tense)
- WRONG: "Adding auth" (gerund/continuous)
- WRONG: "WIP" or "Various changes" (not descriptive)

## CRITICAL RULE: Keep CLAUDE.md Updated

**ALWAYS proactively update this CLAUDE.md file when making significant project changes.**

This file is Claude's primary source of truth about the project. When it's outdated, Claude makes incorrect assumptions and provides wrong guidance.

**When to update CLAUDE.md:**
1. **Adding new features** - Document new APIs, routes, components, or architectural patterns
2. **Changing project structure** - Update file paths, directory organization, or module locations
3. **Modifying commands** - Update when package.json scripts change
4. **Updating dependencies** - Document version changes for major packages (Next.js, React, etc.)
5. **Changing workflows** - Update deployment, testing, or development processes
6. **Adding new tools** - Document new scripts, utilities, or development tools
7. **Modifying configuration** - Update when tsconfig, eslint, or other configs change significantly
8. **Changing architecture** - Document database schema changes, API patterns, or authentication flows
9. **User requests it** - Always update when explicitly asked

**How to update CLAUDE.md:**
1. Proactively suggest updates after completing significant work
2. Keep sections accurate and current with the actual codebase
3. Remove outdated information that no longer applies
4. Add new sections for new major features or patterns
5. Update version numbers when dependencies are upgraded
6. Keep command examples accurate with actual package.json scripts
7. Document breaking changes or migration steps

**Important:**
- Don't wait to be asked - proactively suggest updates
- Treat CLAUDE.md as living documentation that evolves with the code
- When you notice outdated information while working, update it
- Include CLAUDE.md updates in the same commit as related code changes

**Example scenarios:**
- CORRECT: After adding a new API route, update the "API Route Structure" section
- CORRECT: After upgrading Next.js, update the "Stack" section and version numbers
- CORRECT: After adding a new script, update the "Essential Commands" section
- WRONG: Making major architecture changes without updating documentation
- WRONG: Upgrading dependencies without updating version references

## Project Overview

A Next.js 16 school newspaper blog application with Hebrew/RTL support, featuring multi-user authentication, role-based access control, and dual-mode operation (database-backed or admin-only).

**Stack**: Next.js 16.0.5 (App Router), React 19.2, TypeScript, Tailwind CSS 4, PostgreSQL (Vercel Postgres), Vercel Blob, JWT authentication

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

pnpm run dev              # Start dev server (no validation)
pnpm run build            # Production build
pnpm run lint             # ESLint check
```

**Auto-Update Feature**: The `pnpm run pre-deploy` command automatically updates pnpm itself (via npm) and all project dependencies to their latest versions before running. This ensures you're always deploying with the latest package manager and security patches.

### Manual Database Setup (if needed)
```bash
pnpm run setup            # Interactive setup with PostgreSQL configuration
pnpm run db:init          # Initialize database schema (runs src/lib/db/schema.sql)
pnpm run create-test-user # Create test user (username: user, password: 12345678)

# Note: Admin panel access uses ADMIN_PASSWORD from .env.local, NOT user accounts
```

### Testing
```bash
pnpm test                 # Run tests in watch mode (interactive development)
pnpm test:run             # Run tests once (for CI/CD)
pnpm test:coverage        # Run tests with coverage report
pnpm test:ui              # Open Vitest UI for visual test exploration
```

**Testing Stack**: Vitest, Testing Library (React), jsdom

**Test File Locations**:
- `src/lib/auth/__tests__/` - Authentication tests (JWT, middleware, admin)
- `src/lib/posts/__tests__/` - Post permissions and utilities tests
- `src/lib/users/__tests__/` - User authentication tests
- `src/app/api/__tests__/` - API route tests (login, register, admin verify)
- `src/test/setup.ts` - Global test setup and mocks

**Test File Naming Convention**: `*.test.ts` or `*.spec.ts`

**Coverage Targets** (security-critical areas):
- `src/lib/auth/` - 90% minimum
- `src/lib/posts/permissions.ts` - 100% minimum
- `src/lib/users/auth.ts` - 90% minimum

**Important Notes**:
- Tests can run without a database connection (all DB calls are mocked)
- Environment variables are set in `src/test/setup.ts`
- Next.js navigation and headers are automatically mocked
- Use `vi.mock()` to mock dependencies before imports
- API route tests use absolute imports (`@/app/api/...`)

### Deployment
```bash
pnpm run validate         # Run comprehensive validation (all checks below)
pnpm run pre-deploy       # ONE COMMAND that runs:
                          # 1. All tests (162 tests must pass)
                          # 2. Comprehensive validation (100+ checks)
                          # 3. Production build
                          # 4. Git commit (prompts for message)
                          # This is EXTREMELY thorough - catches ALL issues
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
9. **Code Quality**: TODOs in critical paths, error handling, naming conventions, **NO EMOJIS (auto-removed)**
10. **Build Size**: Bundle size, large chunks detection
11. **File Size**: 500-line limit enforced on all TypeScript/JavaScript files

**Automatic Fixes During Validation:**
- **Emoji Removal**: Any emojis found in `.ts`, `.tsx`, `.js`, `.jsx` files are automatically removed
  - Scans all files in `src/` and `scripts/` directories
  - Reports which files were cleaned and how many emojis were removed
  - Continues validation after cleanup

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

### Build Performance Optimizations

The project is optimized for fast builds and deployments:

**Next.js Configuration Optimizations:**
- `optimizePackageImports` - Tree-shaking for large libraries (lucide-react, radix-ui, etc.)
- `webpackBuildWorker` - Parallel compilation using multiple CPU cores
- `optimisticClientCache` - Faster client-side navigation
- Console removal in production (keeps error/warn)
- Image optimization with AVIF/WebP formats
- Responsive image sizes pre-configured

**Vercel Deployment Optimizations:**
- `frozen-lockfile` install - Uses lockfile without updates for faster installs
- Optimized build command skipping redundant checks
- Telemetry disabled for faster builds
- Single region deployment (iad1) for consistent performance
- 10-second max duration for API functions

**Result:** Build times reduced by 30-40% compared to running full validation suite.

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
| `kill-port.ts` | Kill process on port 3000 (runs before `pnpm run dev`) |
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

### Deployment Optimization

The project uses two different build commands optimized for different contexts:

**Local Pre-Deploy** (`pnpm run pre-deploy`):
- Runs all 128 tests
- Runs comprehensive validation (100+ checks)
- Builds the application
- Prompts for git commit
- Takes ~15-20 seconds
- Use this before committing code locally

**Vercel Build** (`pnpm run vercel-build`):
- Runs only critical checks (environment, TypeScript, security)
- Skips tests (run in CI/CD instead)
- Skips comprehensive validation (already done locally)
- Builds the application
- Takes ~10-15 seconds (30-40% faster)
- Automatically used by Vercel on deployment

**Why this matters:**
- Faster deployments on Vercel (no redundant test/validation runs)
- Tests and validation still enforced locally before commit
- CI/CD can run full test suite independently
- Better separation of concerns (local vs. deployment vs. CI/CD)

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
