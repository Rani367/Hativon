# School Newspaper - Hativon

A production-ready Next.js 16 school newspaper application with Hebrew/RTL support, featuring comprehensive testing (244 tests), security-first authentication, database migrations, and professional deployment workflows.

## Features

- **Modern Stack** - Next.js 16.0.6, React 19.2, TypeScript, Tailwind CSS 4
- **Hebrew & RTL Support** - Fully configured for Hebrew language with right-to-left layout
- **Multi-User Authentication** - JWT-based auth with bcrypt password hashing and rate limiting
- **Database Migrations** - Professional migration system with rollback support
- **Comprehensive Testing** - 244 tests with 100% coverage in security-critical areas
- **Zod Validation** - Type-safe API validation with detailed error messages
- **Rich Markdown Editor** - Full GitHub Flavored Markdown with syntax highlighting
- **Self-Hosted Admin Panel** - Complete control, no external dependencies
- **Dual Storage** - Vercel Blob (production) + PostgreSQL (database)
- **Cache Optimization** - Granular cache invalidation with Next.js 16 cache tags
- **Pre-Deployment Validation** - 100+ automated checks ensuring production readiness
- **One-Command Setup** - `pnpm install` configures everything automatically

## Technology Stack

### Core Framework
- **Next.js 16.0.6** - React framework with App Router
- **React 19.2** - UI library with Server Components
- **TypeScript 5.9** - Type-safe JavaScript

### Styling
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library
- **Radix UI** - Unstyled accessible primitives
- **Framer Motion** - Animation library
- **Heebo Font** - Hebrew typeface from Google Fonts

### Database & Storage
- **Vercel Postgres** - Managed PostgreSQL database
- **Vercel Blob** - Object storage for images
- **pg** - PostgreSQL client library
- **@vercel/postgres** - Vercel-optimized database client

### Authentication & Security
- **jsonwebtoken** - JWT token generation/verification
- **bcrypt 6.0** - Password hashing (10 salt rounds)
- **@upstash/ratelimit** - API rate limiting
- **@upstash/redis** - Redis for rate limiting
- **cookie** - Cookie parsing and serialization

### Validation & Forms
- **Zod 4.1** - Schema validation
- **react-hook-form** - Form state management
- **@hookform/resolvers** - Form validation integration

### Markdown & Content
- **react-markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown
- **rehype-raw** - Raw HTML in Markdown
- **react-syntax-highlighter** - Code syntax highlighting

### Testing
- **Vitest 4.0** - Fast unit test framework
- **@testing-library/react** - React component testing
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM implementation for Node.js
- **@vitest/coverage-v8** - Code coverage reporting
- **@vitest/ui** - Visual test explorer

### Development Tools
- **tsx** - TypeScript execution for scripts
- **dotenv** - Environment variable loading
- **glob** - File pattern matching
- **pnpm 10.23** - Fast package manager

## Quick Start

### Prerequisites

**Required:**
- Node.js 18+ (20.x recommended)
- pnpm (install via `npm install -g pnpm` or `corepack enable`)

**Optional:**
- PostgreSQL 13+ (enables multi-user authentication)
- Git (for version control and deployment)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd school-newspaper

# Install dependencies (auto-configures everything)
pnpm install
```

**That's it!** `pnpm install` automatically:
- Creates `.env.local` with secure JWT secret
- Detects PostgreSQL and creates database
- Initializes schema and runs migrations
- Creates test user (username: `user`, password: `12345678`)
- Falls back to admin-only mode if no PostgreSQL

### Development

```bash
# Start development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default credentials:**
- Test user: username=`user`, password=`12345678`
- Admin panel: `/admin` with `ADMIN_PASSWORD` from `.env.local` (default: `admin123`)

### Essential Commands

```bash
# Development
pnpm run dev              # Start dev server
pnpm run build            # Production build
pnpm run lint             # Run ESLint

# Testing
pnpm test                 # Run tests (watch mode)
pnpm test:run             # Run tests once
pnpm test:coverage        # Coverage report

# Database
pnpm run db:init          # Initialize database
pnpm run db:migrate       # Run migrations
pnpm run create-test-user # Create test user

# Deployment
pnpm run pre-deploy       # Tests + validation + build + commit
git push                  # Triggers Vercel deployment
```

## Documentation

For comprehensive developer documentation including:
- Detailed setup and configuration
- Development workflow and database migrations
- Deployment process and validation
- Complete environment variable reference
- Codebase architecture and structure
- Security features and best practices
- Troubleshooting common issues
- Scripts reference

See **[CLAUDE.md](CLAUDE.md)** - Complete developer and AI assistant documentation.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- **Framework**: [Next.js](https://nextjs.org/) - The React Framework
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- **UI Primitives**: [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Hosting**: [Vercel](https://vercel.com/) - Platform for frontend developers
- **Database**: [Vercel Postgres](https://vercel.com/storage/postgres) - Managed PostgreSQL
- **Storage**: [Vercel Blob](https://vercel.com/storage/blob) - Object storage
- **Font**: [Heebo](https://fonts.google.com/specimen/Heebo) - Hebrew typeface by Meir Sadan
- **Testing**: [Vitest](https://vitest.dev/) - Blazing fast unit test framework
- **Icons**: [Lucide](https://lucide.dev/) - Beautiful & consistent icons

Built with love for Hebrew-speaking students.
