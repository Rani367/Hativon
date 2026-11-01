# Hativon

A Hebrew, right-to-left school newspaper. Students write articles, teachers look after them, and each month's articles form an issue that can be read online or printed.

**Live:** https://hativon.vercel.app

## Setup

```bash
bun install
cp .env.example .env.local   # Point POSTGRES_URL at a Neon branch, never production
bun run dev                  # http://localhost:3000
```

## Commands

```bash
bun run verify                  # Lint, typecheck, tests and build. Run after every change.
bun run db:migrate              # Apply pending migrations
bun run db:migrate --status     # Show what is pending
```

## How it fits together

- **Issues aren't a table.** An issue is every published post whose `date` falls in a month, or in a span of months merged into a double issue. See `src/lib/issues/`.
- **Public pages** are server components with almost no JavaScript, cached until something changes them. Every change to a post goes through `src/lib/posts/studio.ts`, which refreshes them.
- **Articles are stored as Markdown.** The editor works in HTML and converts on every change. See `src/lib/markdown/editor-convert.ts`.
- **Writers and teachers** use `/dashboard` and `/admin`. The class code for signing up is set in `/admin/issues`.

## Database

`db/baseline.sql` is the schema the migrations start from. Another app shares the production database, so never restore it wholesale: copy only Hativon's tables.

Migrations are plain SQL in `db/migrations/`. They run by hand, never during a build, and they must stay additive so a rollback to the previous deployment keeps working. The runner refuses production unless `ALLOW_PRODUCTION_MIGRATION=yes` is set.
