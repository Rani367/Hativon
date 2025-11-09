# Quick Start

## Prerequisites

Install pnpm first:

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

## Two Simple Commands

### Development (No Validation)

```bash
pnpm run dev
```

Starts the development server immediately. No checks, fast startup.

### Pre-Deployment (Full Validation)

```bash
pnpm run pre-deploy
```

Runs all checks and builds:
- Environment variables validated
- TypeScript compilation
- ESLint (warnings only)
- All critical files present
- Production build

**If this passes, your Vercel deployment will succeed!**

---

## First Time Setup

1. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Generate JWT secret:
   ```bash
   openssl rand -base64 32
   ```

3. Edit `.env.local` and fill in:
   ```bash
   JWT_SECRET=<paste_generated_secret_here>
   ADMIN_PASSWORD=your_secure_password
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Test everything:
   ```bash
   pnpm run pre-deploy
   ```

5. Start developing:
   ```bash
   pnpm run dev
   ```

---

For more details, see [README.md](../README.md) or [DEPLOYMENT.md](../DEPLOYMENT.md).
