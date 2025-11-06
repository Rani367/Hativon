# School Newspaper Blog

A modern Next.js 16 blog application with self-hosted admin panel, designed for Hebrew language content with RTL support. Features include user authentication, multi-author support, and comprehensive pre-deployment validation.

## ✨ Features

- 🌐 **Hebrew & RTL Support** - Fully configured for Hebrew language with right-to-left layout
- 👥 **Multi-User Authentication** - JWT-based auth with role-based access control (Admin & User roles)
- 📝 **Rich Markdown Editor** - Full GitHub Flavored Markdown with syntax highlighting
- 🔒 **Self-Hosted Admin Panel** - No external dependencies, complete control
- ☁️ **Dual Storage** - Vercel Blob (production) + Local JSON (development)
- 📊 **Admin Dashboard** - Statistics, user management, post management
- 🎨 **Modern UI** - Built with Tailwind CSS 4 and shadcn/ui components
- ✅ **Pre-Deployment Validation** - Automated checks for environment, types, and build
- 🚀 **GitHub Actions** - Optional CI/CD with automated validation
- 🗃️ **PostgreSQL Database** - User management with Vercel Postgres

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd school-newpaper
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

```bash
# Generate JWT secret with: openssl rand -base64 32
JWT_SECRET=your_generated_secret_here
ADMIN_PASSWORD=your_secure_password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Validate Configuration

```bash
npm run validate:env
```

Fix any errors before proceeding.

### 4. Set Up Database (Optional)

For user authentication:

```bash
npm run db:init
npm run create-admin
```

Or skip this to use admin-only mode (no user registration).

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Access Admin Panel

Visit [http://localhost:3000/admin](http://localhost:3000/admin) and login with your `ADMIN_PASSWORD`.

## 📋 Available Scripts

### Development
```bash
npm run dev          # Start development server (no checks, starts immediately)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Deployment
```bash
npm run pre-deploy   # Run ALL validation checks + build (use this before deploying!)
```

### Database
```bash
npm run db:init      # Initialize PostgreSQL database
npm run create-admin # Create admin user account
```

## 🔧 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Vercel Postgres (PostgreSQL)
- **Storage**: Vercel Blob + Local JSON
- **Authentication**: JWT with HTTP-only cookies
- **Markdown**: react-markdown + remark-gfm
- **Package Manager**: pnpm

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Complete guide for deploying to Vercel
- **[Project Instructions](CLAUDE.md)** - Technical documentation for developers

## 🎯 User Roles

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

## 🔐 Authentication System

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

## 🚀 Deployment

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
   - After deploy, run `npm run db:init`
   - Create admin: `npm run create-admin`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## ✅ Pre-Deployment Validation

The project includes comprehensive validation to catch issues before deployment:

- ✓ Environment variables (presence, format, strength)
- ✓ TypeScript compilation
- ✓ ESLint rules
- ✓ Required dependencies
- ✓ Critical files existence
- ✓ Database connectivity and schema
- ✓ Build success

**Validation runs automatically on Vercel deployment** via `vercel.json` configuration.

## 🐛 Troubleshooting

### Build Fails Locally

```bash
# Run full validation + build (shows all issues)
npm run pre-deploy
```

### Environment Variable Issues

```bash
# Check .env.example for required variables
cat .env.example

# Test configuration
npm run pre-deploy
```

### Database Issues

```bash
# Reinitialize database
npm run db:init

# Create admin user
npm run create-admin
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for more troubleshooting tips.

## 📁 Project Structure

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run validation: `npm run validate`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Hosted on [Vercel](https://vercel.com/)
- Font: [Heebo](https://fonts.google.com/specimen/Heebo) (Hebrew typeface)

---

**Need help?** Check the [Deployment Guide](DEPLOYMENT.md) or [Technical Documentation](CLAUDE.md).
