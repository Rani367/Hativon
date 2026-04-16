# Repository Guidelines

## Project Structure & Module Organization
`src/app/` contains App Router pages, layouts, and API handlers under `api/**/route.ts`. Put reusable UI in `src/components/ui/`, feature code in `src/components/features/`, layout code in `src/components/layout/`, and shared logic in `src/lib/`. Database migrations live in `src/lib/db/migrations/`. Use `public/` for static assets and fonts, `scripts/` for Bun utilities, and `data/` for local fallback storage.

## Build, Test, and Development Commands
Use Bun for all local work:

- `bun install` installs dependencies and runs automated local setup.
- `bun dev` starts the app on `http://localhost:3000` after freeing port `3000`.
- `bun run build` creates the production build; `bun run start` serves it.
- `bun run lint` runs the Next.js ESLint rules.
- `bun test` runs the Bun test suite; `bun test --coverage` adds coverage output.
- `bun run verify` is the pre-PR check (`bun test && bun run build`).
- `bun run db:init` and `bun run db:migrate` initialize or update the Postgres schema.

## Coding Style & Naming Conventions
This repo uses strict TypeScript with the `@/*` alias for `src`. Match the existing style: 2-space indentation, double quotes, semicolons, and trailing commas. Keep filenames kebab-case (`post-card.tsx`), export components in PascalCase, and name hooks with the `use-` prefix. Preserve Next.js file conventions such as `page.tsx`, `layout.tsx`, `loading.tsx`, and `route.ts`. ESLint enforces `next/core-web-vitals`; unused variables must be removed or prefixed with `_`, and `console` should stay limited to `warn`/`error`.

## Testing Guidelines
Place tests next to the code they cover in `__tests__/` directories using `*.test.ts` or `*.test.tsx`. Bun preloads `test.setup.ts`, which wires up `happy-dom` and shared module delegates. Reuse those delegates for DB, logger, and posts mocks instead of redefining globals per file. Add tests for changes to API routes, auth, DB access, and post workflows.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects tied to the affected area, for example `Improve post card mobile CTA and image preload`. Keep commits scoped and separate refactors from behavior changes when possible. PRs should include a concise summary, linked issue when relevant, screenshots for UI changes, migration or env-var notes, and manual verification for the affected flow. Run `bun run verify` before requesting review.

## Security & Configuration Tips
Keep secrets in `.env.local` only; never commit credentials. Required local variables are `ADMIN_PASSWORD`, `JWT_SECRET`, and `NEXT_PUBLIC_SITE_URL`. `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` enable full auth and database-backed flows, while `BLOB_READ_WRITE_TOKEN` enables production-style uploads.
