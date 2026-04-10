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

## Commands

- `bun run verify` — tests + production build. **Run after every code change. Iterate until zero failures.**
- `bun run pre-deploy` — verify + commit.
- `bun test` — tests only.

## Rules

**Git:** Never use `git commit` directly — use `bun run pre-deploy`. Never push (user does that manually). Commit messages: imperative mood, concise ("Add user auth middleware", "Fix responsive layout on mobile").

**No `any`:** Use `unknown` with type guards, proper interfaces, or `Record<string, T>`. Catch blocks: `catch (error) { const message = error instanceof Error ? error.message : String(error); }`. Exception: test files mocking complex external dependencies.

**No emojis:** Not in code, comments, console output, or documentation. Use `[OK]`, `[ERROR]`, `[WARNING]` prefixes.

**No .md files:** Never create markdown files except `CLAUDE.md` and `README.md`.

**Tests are read-only:** Never modify test files, ESLint config, or `tsconfig.json` unless explicitly asked. If tests fail, fix the source code.

**Keep CLAUDE.md current:** Update this file when adding features, changing structure, or modifying config.

## Hebrew/RTL

The entire UI is Hebrew (RTL). Font: Heebo. `dir="rtl"` on `<html>`.

ALWAYS use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`). NEVER use directional equivalents (`ml-`, `mr-`, `pl-`, `pr-`, `left`, `right`).

## Gotchas

**Vercel console output:** Vercel treats "error" and "fail" in console output as build failures, even in informational messages. Use "issue", "problem", or "did not pass" instead. Reserve "error"/"fail" for actual errors only.
