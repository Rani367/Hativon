# Deployment Guide

This guide covers the pre-deployment checks and validation system for the blog application.

## Quick Start

Before deploying to Vercel, run:

```bash
npm run pre-deploy
```

This will validate your environment and build the application.

## Two Simple Commands

### For Development (No Checks)

```bash
npm run dev
```

Starts the development server immediately without any validation checks. Use this for fast iteration during development.

### For Deployment (Full Validation)

```bash
npm run pre-deploy
```

Runs **all** validation checks and builds the application:

**Environment Validation:**
- `ADMIN_PASSWORD` is set and strong
- `JWT_SECRET` is at least 32 characters
- `NEXT_PUBLIC_SITE_URL` is a valid URL
- `SESSION_DURATION` is reasonable (if set)
- `POSTGRES_URL` configuration (warns if missing)
- `BLOB_READ_WRITE_TOKEN` configuration

**Build Validation:**
- Node modules are installed
- All required dependencies present
- Critical files exist
- Database schema file present
- TypeScript compiles without errors
- ESLint passes (warnings only)
- Git status (warns about uncommitted changes)

**Build:**
- Next.js production build

If `npm run pre-deploy` succeeds locally, your deployment to Vercel will succeed!

## Setting Up Environment Variables

### Step 1: Copy the Example File

```bash
cp .env.example .env.local
```

### Step 2: Generate Secrets

Generate a secure JWT secret:

```bash
openssl rand -base64 32
```

### Step 3: Fill in Required Values

Edit `.env.local` and set:

```bash
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET=<paste_generated_secret_here>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 4: Test Everything

```bash
npm run pre-deploy
```

This will validate everything and build. Fix any errors before proceeding.

## Deploying to Vercel

### Initial Setup

1. **Push your code to GitHub**

2. **Connect to Vercel**
   - Import your repository at [vercel.com](https://vercel.com)
   - Vercel will detect the Next.js framework automatically

3. **Enable Vercel Postgres**
   - Go to your project dashboard
   - Navigate to Storage tab
   - Click "Create Database" → "Postgres"
   - This auto-sets `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`

4. **Enable Vercel Blob Storage**
   - In Storage tab
   - Click "Create Database" → "Blob"
   - This auto-sets `BLOB_READ_WRITE_TOKEN`

5. **Set Environment Variables**

   In Vercel dashboard → Settings → Environment Variables, add:

   ```
   ADMIN_PASSWORD=your_secure_password
   JWT_SECRET=your_generated_jwt_secret
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   SESSION_DURATION=604800  (optional)
   ```

   **Important:**
   - Use strong, unique values (not localhost/dev values)
   - Generate JWT_SECRET with: `openssl rand -base64 32`
   - Set for "Production" environment

6. **Deploy**
   - Click "Deploy" or push to main branch
   - Vercel will automatically run validation via `vercel.json` buildCommand
   - Build will fail if validation doesn't pass

### Post-Deployment Setup

7. **Initialize Database**

   Connect to your production database and run:

   ```bash
   # Using Vercel CLI (recommended)
   npm run db:init
   ```

   Or manually run the SQL from [src/lib/db/schema.sql](src/lib/db/schema.sql)

8. **Create Admin User**

   ```bash
   npm run create-admin
   ```

   Or login with `ADMIN_PASSWORD` at `/admin` (auto-creates admin user)

9. **Test Everything**
   - Visit `yourdomain.com/admin` - should show login
   - Click "התחבר" button - should show register/login dialog
   - Create a test post
   - Verify user registration works

## What Gets Validated on Deploy

When you deploy to Vercel, the `vercel.json` configuration runs:

```bash
npm run validate && npm run build
```

This ensures:

1. **Environment Variables**
   - All required vars are set
   - JWT_SECRET is strong enough
   - URLs are properly formatted
   - No placeholder values in production

2. **TypeScript Compilation**
   - All code compiles without errors
   - Type safety is maintained

3. **Code Quality**
   - ESLint rules pass
   - No linting errors

4. **Dependencies**
   - All packages installed
   - No missing dependencies

5. **Critical Files**
   - All required files exist
   - Database schema present

**If any check fails, the deployment will be blocked.**

## GitHub Actions (Optional)

The project includes a GitHub Actions workflow that runs on every push and pull request.

### What It Does

- Runs all validation checks
- Tests TypeScript compilation
- Runs ESLint
- Builds the application
- Checks database (if configured)
- Comments on PRs with results

### Setup

The workflow is automatically active if you push to GitHub. To use production environment variables in CI:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add repository secrets:
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_SITE_URL`
   - `POSTGRES_URL` (optional, for DB checks)

The workflow will use these for validation.

## Troubleshooting

### "ADMIN_PASSWORD is required"

**Solution:** Set `ADMIN_PASSWORD` in your environment variables (`.env.local` locally, Vercel dashboard for production)

### "JWT_SECRET must be at least 32 characters"

**Solution:** Generate a proper secret:
```bash
openssl rand -base64 32
```
Copy the output to your `JWT_SECRET` environment variable.

### "TypeScript errors detected"

**Solution:** The `npm run pre-deploy` command will show you the exact TypeScript errors. Fix them and run again.

### "ESLint warnings"

**Solution:** ESLint issues are warnings only and won't block deployment. Fix them if desired by running `npm run lint`.

### "Database not configured"

**Solution:**
- For production: Enable Vercel Postgres in your dashboard
- For local: Set up local Postgres and add `POSTGRES_URL` to `.env.local`
- Or ignore if you only want admin-only mode (no user authentication)

### "Missing critical files"

**Solution:** Ensure you haven't accidentally deleted required files. Check the error message for which files are missing.

### Build succeeds locally but fails on Vercel

**Solutions:**
1. Check environment variables in Vercel dashboard match your `.env.local`
2. Ensure `NEXT_PUBLIC_SITE_URL` uses your production domain (not localhost)
3. Check Vercel build logs for specific errors
4. Verify Node.js version matches (20.x recommended)

## Best Practices

1. **Always validate before pushing:**
   ```bash
   npm run validate
   ```

2. **Use strong secrets:**
   - Never use "admin123" or "password"
   - Generate JWT secrets properly
   - Don't commit secrets to git

3. **Test locally first:**
   ```bash
   npm run pre-deploy
   ```
   If this passes, deployment should succeed.

4. **Check database after deploy:**
   ```bash
   npm run check:db
   ```

5. **Keep .env.local updated:**
   - Reference `.env.example` for all variables
   - Document any custom variables you add

## Security Notes

- Never commit `.env.local` or `.env` files
- Use different secrets for dev and production
- Rotate JWT_SECRET if compromised
- Use strong admin passwords (16+ chars recommended)
- Enable Vercel authentication for sensitive projects

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [GitHub Actions](https://docs.github.com/en/actions)

---

For more information about the project, see [CLAUDE.md](CLAUDE.md).
