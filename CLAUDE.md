# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Hebrew/RTL school-newspaper app on Next.js 16 (App Router, React 19) + Vercel, Neon Postgres and Vercel Blob.

> **Temporary, until cutover:** the rebuild lives on the `rebuild` branch, a one-time exception to "always push directly to main". The cutover merge removes this note.

## Commands

Use **Bun**: there's no `packageManager` field, so don't default to npm/pnpm.

- `bun run verify` (lint, typecheck, `bun test`, build): **run after every change and fix all failures, even unrelated ones.** GitHub Actions is currently off for this repo, so nothing runs this for you.
- `bun run dev`: dev server.
- `bun run db:migrate`, with `--status` to preview: applies `db/migrations/`. Runs by hand, never during a build.

## Runtime

Request handlers run on **Node**, proven by `/api/health`. Bun is only for install, tests and scripts, so keep app code runtime-agnostic. Don't add `bunVersion` to `vercel.json`: Vercel's docs say it switches the function runtime.

## Rules with a history

- **Never catch a database error and return something empty.** Public pages are cached, so an outage would be cached as an empty issue or a fake 404. Let it throw, and the old page stays up.
- **Never redirect from a public page.** On Vercel a redirect from a cached page sends a doubled `Location` header and ends in a 404. Merged months and old slugs answer directly with a canonical tag.
- **No `loading.tsx` on public routes.** It turns 404s into cached 200s.
- **The photo morph can't block navigation.** Public links are plain `<a>`, with no overlays and no `preventDefault`. The old overlay locked up twice. `src/__tests__/public-guards.test.ts` enforces these.
- **Keep migrations additive,** so Instant Rollback stays safe.
- **Never restore the production database wholesale.** Another app's `wit_*` tables live in it. Baselines exclude them.
- **Local work and previews use the Neon `rebuild` branch,** never production. Timestamps have no time zone: read them with `AT TIME ZONE 'UTC'`.
- **Stored content stays Markdown.** No `rehype-raw` (raw HTML stays dropped) and no `remark-breaks` (old articles would reflow).
- **Cover images:** the card URL is derived from `/full.*` as `/card.webp` in `src/lib/images/post-images.ts`. Renaming either file breaks every card.
- **Use `bcryptjs`,** never `Bun.password`, which doesn't exist on Node. Use tagged-template queries.

## Conventions

- Imports use the `@/*` alias for `src/`; filenames are kebab-case.
- All Hebrew lives in `src/lib/copy.ts` and `src/lib/studio-copy.ts`: "כתבה" for an article, and the plural imperative.
- Black and white only. The one colour on the site is a student's opened photo.
- ESLint errors on unused vars (prefix intentionally-unused args with `_`); `console` allows only `warn`/`error`.
- Tests live in colocated `__tests__/` dirs. Test logic that's easy to get wrong, not the framework.
- Manually verify auth flows and any DB/migration changes on a Neon branch before pushing.
- always push directly to main, no branches.

## Environment

See `.env.example`. Required: `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`, `POSTGRES_URL`. Uploads need `BLOB_READ_WRITE_TOKEN`. Production needs Upstash for rate limits to work.
