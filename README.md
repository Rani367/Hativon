# School Newspaper Blog

A modern Next.js 16 blog application with self-hosted admin panel, designed for Hebrew language content with RTL support. Features include user authentication, multi-author support, and comprehensive pre-deployment validation.

## Features

- **Hebrew & RTL Support** - Fully configured for Hebrew language with right-to-left layout
- **Multi-User Authentication** - JWT-based auth with role-based access control (Admin & User roles)
- **Rich Markdown Editor** - Full GitHub Flavored Markdown with syntax highlighting
- **Self-Hosted Admin Panel** - No external dependencies, complete control
- **Dual Storage** - Vercel Blob (production) + Local JSON (development)
- **Admin Dashboard** - Statistics, user management, post management
- **Modern UI** - Built with Tailwind CSS 4 and shadcn/ui components
- **Pre-Deployment Validation** - Automated checks matching Vercel's exact deployment process
- **One-Command Deployment** - Validate, build, and push to GitHub with a single command
- **PostgreSQL Database** - User management with Vercel Postgres

## Quick Start

**TL;DR:** Install pnpm → `pnpm install` → `pnpm run dev` → Open http://localhost:3000

---

### 1. Install pnpm

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

Or using Homebrew (macOS):
```bash
brew install pnpm
```

Or enable corepack (Node.js 16.13+):
```bash
corepack enable
```

### 2. Clone and Install (Automated Setup)

```bash
git clone <your-repo-url>
cd school-newspaper
pnpm install
```

**That's it!** `pnpm install` automatically:
- Creates `data/` directory for local posts storage
- Generates `.env.local` with secure JWT secret
- Sets default admin password: `admin123` (⚠️ change this!)
- Prepares your development environment

### 3. Start Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Access Admin Panel

Visit [http://localhost:3000/admin](http://localhost:3000/admin) and login with the admin password (`admin123` by default).

---

### Optional: Interactive Setup with Database

For full features with PostgreSQL and multi-user authentication:

```bash
pnpm run setup
```

This interactive script will:
- Prompt for custom admin password
- Detect and configure PostgreSQL if available
- Initialize database schema automatically
- Create optimal development environment

After setup, create your first user:
```bash
pnpm run create-admin
```

## Available Scripts

### Setup
```bash
pnpm run setup       # Interactive setup with database configuration
pnpm run setup:db    # Legacy Arch Linux PostgreSQL setup
```

### Development
```bash
pnpm run dev         # Start development server (no checks, starts immediately)
pnpm run build       # Build for production
pnpm run start       # Start production server
pnpm run lint        # Run ESLint
```

### Deployment
```bash
pnpm run pre-deploy  # Run ALL validation checks + build (use this before deploying!)
```

### Database
```bash
pnpm run db:init     # Initialize PostgreSQL database
pnpm run create-admin # Create admin user account
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Vercel Postgres (PostgreSQL)
- **Storage**: Vercel Blob + Local JSON
- **Authentication**: JWT with HTTP-only cookies
- **Markdown**: react-markdown + remark-gfm
- **Package Manager**: pnpm

## Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Complete guide for deploying to Vercel
- **[Project Instructions](CLAUDE.md)** - Technical documentation for developers

## User Roles

### Admin
- Full access to all posts and users
- Can edit/delete any post
- Access to admin dashboard at `/admin`
- User management interface

### Regular User
- Create and manage own posts
- Personal dashboard at `/dashboard`
- Can only edit/delete own posts
- Register via "התחבר" (Login) button

## Authentication System

The blog supports two authentication modes:

### 1. Full User Authentication (Recommended)
- Requires PostgreSQL database
- Multi-user support with registration
- Role-based access control
- JWT-based sessions

### 2. Admin-Only Mode (Legacy)
- No database required
- Single admin account only
- Simple cookie authentication
- Fallback when `POSTGRES_URL` is not set

## Deployment

### Deploy to Vercel

1. **Connect to Vercel**
   - Push code to GitHub
   - Import repository at [vercel.com](https://vercel.com)

2. **Enable Storage**
   - Add Vercel Postgres (Storage tab)
   - Add Vercel Blob (Storage tab)

3. **Set Environment Variables**
   ```
   ADMIN_PASSWORD=your_secure_password
   JWT_SECRET=your_jwt_secret
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

4. **Deploy & Initialize**
   - Vercel will run validation automatically
   - After deploy, run `pnpm run db:init`
   - Create admin: `pnpm run create-admin`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Pre-Deployment Validation & Deployment

The project includes a **streamlined deployment workflow** that validates, builds, and commits your code:

```bash
pnpm run pre-deploy   # Validate, build, and commit
git push              # Push to GitHub and trigger Vercel deployment
```

**What `pnpm run pre-deploy` does:**
1. Validates environment variables (presence, format, strength)
2. Validates build configuration (dependencies, files, etc.)
3. Runs Next.js build (TypeScript compilation, ESLint rules)
4. Shows git status and prompts for commit
5. Asks for commit message
6. Commits changes locally

**Interactive workflow:**
```bash
$ pnpm run pre-deploy

# Validation passes...
# Build succeeds...

=== Git Deployment ===
Current branch: main
Changes:
  Modified: 5 file(s)
  Added: 2 file(s)

Do you want to commit these changes? (y/n): y
Enter commit message:
> Add student grade display feature

✓ Changes staged
✓ Changes committed
✓ Commit successful!
Your changes have been committed locally.
To push to GitHub, run: git push

$ git push
# Deployment triggered on Vercel
```

**Note:** The git commit step is automatically skipped when running on Vercel (CI/CD environment).

**Validation runs automatically on Vercel deployment** via `vercel.json` configuration.

## Troubleshooting

### Build Fails Locally

```bash
# Run full validation + build (shows all issues)
pnpm run pre-deploy
```

### Environment Variable Issues

```bash
# Check .env.example for required variables
cat .env.example

# Test configuration
pnpm run pre-deploy
```

### Database Issues

```bash
# Reinitialize database
pnpm run db:init

# Create admin user
pnpm run create-admin
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for more troubleshooting tips.

## Project Structure

```
school-newpaper/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── admin/        # Admin panel pages
│   │   ├── api/          # API routes
│   │   ├── posts/        # Blog post pages
│   │   └── page.tsx      # Homepage
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities and business logic
│   │   ├── auth/         # Authentication logic
│   │   ├── db/           # Database setup
│   │   ├── posts.ts      # Public post API
│   │   ├── posts-storage.ts  # CRUD operations
│   │   └── users.ts      # User management
│   └── types/            # TypeScript types
├── scripts/              # Utility scripts
│   ├── validate-env.ts   # Environment validation
│   ├── validate-build.ts # Build validation
│   ├── check-db.ts       # Database checks
│   ├── init-db.ts        # Database initialization
│   └── create-admin.ts   # Admin user creation
├── .github/workflows/    # GitHub Actions
├── public/               # Static assets
├── .env.example          # Environment variable template
├── vercel.json           # Vercel configuration
├── CLAUDE.md             # Developer documentation
├── DEPLOYMENT.md         # Deployment guide
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run validation: `pnpm run pre-deploy`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Hosted on [Vercel](https://vercel.com/)
- Font: [Heebo](https://fonts.google.com/specimen/Heebo) (Hebrew typeface)

---

**Need help?** Check the [Deployment Guide](DEPLOYMENT.md) or [Technical Documentation](CLAUDE.md).
