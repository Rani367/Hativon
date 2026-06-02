// Activates @testing-library/jest-dom matcher types on bun:test's `expect`.
//
// test.setup.ts does `expect.extend(jestDomMatchers)` at runtime, but TypeScript
// can't infer that. The package ships a `bun:test` `Matchers` augmentation at
// types/bun.d.ts, but its `exports` map doesn't expose that subpath, so it can't
// be imported by specifier. A triple-slash path reference includes the file
// directly (its internal `./matchers` import is relative, so it isn't gated by
// exports). This makes matchers like `toBeInTheDocument` / `toHaveClass` /
// `toContainElement` type-check across the test files. Type-only; never emitted.
/// <reference path="../../node_modules/@testing-library/jest-dom/types/bun.d.ts" />
