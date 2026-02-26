# CLAUDE.md

Deployed site: https://hativon.vercel.app/

## Project Overview

Hativon - a Hebrew school newspaper built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, PostgreSQL (Vercel Postgres), Vercel Blob, JWT auth. Uses pnpm.

## Rules

### Always Verify
Run `pnpm run verify` at the end of every task that modifies code. Keep iterating until it passes with zero failures. It runs tests, validation (100+ checks), and production build.

### No Emojis
Never use emojis in code, comments, console output, or documentation. Use text prefixes like `[OK]`, `[ERROR]`, `[WARNING]` instead.

### No Markdown Files
Never create .md files except `CLAUDE.md` and `README.md`. Put documentation in code comments, JSDoc, or these two files.

### TypeScript: No `any`
Never use the `any` type. Use `unknown` with type guards, proper interfaces, or `Record<string, T>`.

For error handling (the tricky one):
- WRONG: `catch (error: any) { console.log(error.message); }`
- CORRECT: `catch (error) { const message = error instanceof Error ? error.message : String(error); }`

Only exception: test files mocking complex external dependencies.

### Git Workflow
- Never commit directly with `git commit`. Use `pnpm run pre-deploy` (runs tests + validation + build + commit).
- Never push to GitHub. The user does that manually.
- For validation without committing, use `pnpm run verify`.

### Never Edit Validation/Tests Without Permission
Never modify files in `scripts/`, test files, ESLint config, or `tsconfig.json` unless explicitly asked. If validation fails, fix the source code, not the checks.

### Commit Messages
Imperative mood, concise. Examples: "Add user auth middleware", "Fix responsive layout on mobile".

### Keep CLAUDE.md Updated
Proactively update this file when making significant changes (new features, structure changes, dependency updates, config changes).

## Hebrew/RTL

- The entire UI is Hebrew (RTL). Font: Heebo via Google Fonts.
- `dir="rtl"` on `<html>`. All UI text in Hebrew.
- Use logical CSS properties (`ms-`, `me-`, `start`, `end`) instead of directional (`ml-`, `mr-`, `left`, `right`).

## Vercel Console Output Gotcha

Vercel's build system treats words like "error" and "fail" in console output as build failures, even in informational messages. In build/validation scripts:
- Use "issue", "problem", or "validation failure" instead of "error"
- Use "did not pass" instead of "fail" for informational context
- Reserve "error"/"fail" for actual error reporting only

## Code Quality
All code and docs should seem 100% human written.
