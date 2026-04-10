# Hativon

A school newspaper application with Hebrew/RTL support.

**Live Site:** https://hativon.vercel.app

## Setup

```bash
bun install    # Installs dependencies and auto-configures everything
bun dev    # Start development server at http://localhost:3000
```

Default credentials after setup:
- Test user: `user` / `12345678`
- Admin panel (`/admin`): uses `ADMIN_PASSWORD` from `.env.local`

## Commands

### Development
```bash
bun run dev              # Start dev server
bun run build            # Production build
bun run lint             # ESLint check
```

### Testing
```bash
bun test                 # Run tests
bun test --coverage      # With coverage
```

### Manual verification
```text
1. Student flow: register/login -> edit profile -> create draft -> recover autosave -> publish
2. Teacher flow: register/login as teacher -> open /admin/dashboard -> review posts/users
3. Reading flow: open current month page on mobile width -> open a post -> confirm metadata/readability
4. Edge cases: empty month, teacher badge visibility, deleting a draft, dashboard pagination
```

### Database
```bash
bun run db:init          # Initialize schema
bun run db:migrate       # Run migrations
bun run db:migrate:status
bun run db:migrate:rollback
bun run create-test-user # Create test user
```

### Deployment
```bash
bun run pre-deploy       # Tests + build + commit
git push                 # Triggers Vercel deployment
```

## Documentation

See [CLAUDE.md](CLAUDE.md) for full developer documentation.
