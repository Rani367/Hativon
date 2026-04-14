# CLAUDE.md

## Project

Hativon — Hebrew school newspaper. Deployed at https://hativon.vercel.app/

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, PostgreSQL (Vercel Postgres), Vercel Blob, JWT auth, Bun (package manager, script runner, test runner).

## Structure

```
src/
  app/          # Next.js App Router pages and API routes
  components/   # UI split into features/, layout/, shared/, ui/
  lib/          # Server-side: db/, auth/, posts/, validation/, api/, cache/
  hooks/        # Client-side React hooks
  types/        # Shared TypeScript types
  test/         # Test setup and helpers
```

### Post Open Transition

- `src/components/layout/layout-client.tsx` mounts the public-site post transition provider.
- `src/components/features/posts/post-card.tsx` measures the clicked card and starts the transition.
- `src/components/features/posts/post-page-transition-shell.tsx` registers the destination hero/header geometry on the post page.
- `src/components/features/posts/post-open-transition-provider.tsx` owns the shared overlay and reduced-motion fallback.

## Commands

- `bun run verify` — tests + production build. Run after every code change.
- `bun run pre-deploy` — verify + commit.
- `bun test` — tests only.

## Rules

**Git:** Never use `git commit` directly — use `bun run pre-deploy`. Never push.

**No `any`:** Use `unknown` with type guards, proper interfaces, or `Record<string, T>`.

**No emojis:** Not in code, comments, console output, or documentation. Use `[OK]`, `[ERROR]`, `[WARNING]` prefixes.

**No .md files:** Never create markdown files except `CLAUDE.md` and `README.md`.

**Tests are read-only:** Never modify test files, ESLint config, or `tsconfig.json` unless explicitly asked. If tests fail, fix the source code.

## Hebrew/RTL

The entire UI is Hebrew (RTL). Font: Heebo. `dir="rtl"` on `<html>`.

ALWAYS use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`). NEVER use directional equivalents (`ml-`, `mr-`, `pl-`, `pr-`, `left`, `right`).

## Gotchas

**Vercel console output:** Vercel treats "error" and "fail" in console output as build failures, even in informational messages. Use "issue", "problem", or "did not pass" instead. Reserve "error"/"fail" for actual errors only.
