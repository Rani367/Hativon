# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Hebrew/RTL school-newspaper app on Next.js 16 (App Router, React 19) + Vercel.

## Commands

Use **Bun** — there's no `packageManager` field, so don't default to npm/pnpm.

- `bun run verify` (`bun test && bun run build`) — **run after every change; fix all failures even if unrelated; must pass before a PR.** Caveat: `next.config.ts` sets `typescript.ignoreBuildErrors: true`, so the build does **not** catch type errors — run `bunx tsc --noEmit` to typecheck.
- `bun run dev` — dev server (a `predev` hook frees port 3000 first).
- `bun run db:migrate` — custom migration runner (`:status`, `:rollback [N]` variants); `db:init` loads `schema.sql`, `db:create-migration` scaffolds one.
- `bun run hash-admin-password` — hash `ADMIN_PASSWORD` for production; `bun run create-test-user` — seed a local user.

## Runtime gotcha: build runs on Bun, request handlers run on Node

`vercel.json` sets `bunVersion: 1.x`, so install/build use Bun — but that controls the *build* only. Next.js route handlers execute on Vercel's **Node.js function runtime** at request time. Bugs have come from both sides, so keep app/runtime code runtime-agnostic:
- Password hashing: use `bcryptjs`, **never `Bun.password`** — it's `undefined` in handlers and threw ReferenceError on Vercel, silently breaking login (commit `0943f5d`).
- Postgres: use the tagged-template form (`` db.query`... ${val}` ``), not the dynamic `db.query([queryString, ...values])` array form — the array form broke under the Bun runtime (commit `2c28697`).

## Conventions

- Imports use the `@/*` alias for `src/`; filenames are kebab-case.
- ESLint errors on unused vars (prefix intentionally-unused args with `_`); `console` allows only `warn`/`error`.
- Tests: `bunfig.toml` preloads `test.setup.ts` with shared mocks (DB, logger, posts, Next.js navigation/headers/cache) — reuse them, don't redefine per file. Tests live in colocated `__tests__/` dirs.
- Manually verify auth flows and any DB/migration changes locally before pushing — these are easy to break in ways tests don't catch.

## Environment

Required in `.env.local`: `ADMIN_PASSWORD`, `JWT_SECRET` (32+ chars), `NEXT_PUBLIC_SITE_URL`. Without `POSTGRES_URL*` the app falls back to admin-only mode (no user auth).
