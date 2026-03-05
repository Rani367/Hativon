# Quick Start

## Prerequisites

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

Or using Homebrew (macOS):
```bash
brew install oven-sh/bun/bun
```

## Two Simple Commands

### Development (No Validation)

```bash
bun run dev
```

Starts the development server immediately. No checks, fast startup.

### Pre-Deployment (Full Validation)

```bash
bun run pre-deploy
```

Runs tests and builds:
- All tests pass
- Production build succeeds

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
   bun run pre-deploy
   ```

5. Start developing:
   ```bash
   bun run dev
   ```

---

For more details, see [README.md](../README.md).
