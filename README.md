# Hativon

A school newspaper application with Hebrew/RTL support.

## Setup

```bash
pnpm install    # Installs dependencies and auto-configures everything
pnpm run dev    # Start development server at http://localhost:3000
```

Default credentials after setup:
- Test user: `user` / `12345678`
- Admin panel (`/admin`): uses `ADMIN_PASSWORD` from `.env.local`

## Commands

### Development
```bash
pnpm run dev              # Start dev server
pnpm run build            # Production build
pnpm run lint             # ESLint check
```

### Testing
```bash
pnpm test                 # Watch mode
pnpm test:run             # Run once
pnpm test:coverage        # With coverage
```

### Database
```bash
pnpm run db:init          # Initialize schema
pnpm run db:migrate       # Run migrations
pnpm run db:migrate:status
pnpm run db:migrate:rollback
pnpm run create-test-user # Create test user
```

### Deployment
```bash
pnpm run pre-deploy       # Tests + validation + build + commit
git push                  # Triggers Vercel deployment
```

## Documentation

See [CLAUDE.md](CLAUDE.md) for full developer documentation.
