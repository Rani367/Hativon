import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * The old app's page transition locked up readers more than once, and its
 * client-side code cost every reader hundreds of kilobytes. These rules keep
 * those mistakes from coming back as the code changes.
 */

const SOURCE = path.join(import.meta.dir, "..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) {
      return entry === "__tests__" ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const publicFiles = [
  ...sourceFiles(path.join(SOURCE, "app", "(public)")),
  ...sourceFiles(path.join(SOURCE, "components", "public")),
  path.join(SOURCE, "lib", "page-script.ts"),
];

const read = (file: string) => readFileSync(file, "utf8");
const relative = (file: string) => path.relative(SOURCE, file);

// The only client components a reader's browser has to run.
const ALLOWED_CLIENT_COMPONENTS = [
  "components/public/print-button.tsx",
  "components/public/theme-toggle.tsx",
];

describe("public pages", () => {
  it("found the files to check", () => {
    expect(publicFiles.length).toBeGreaterThan(5);
  });

  it("never blocks a link from navigating", () => {
    const offenders = publicFiles.filter((file) =>
      read(file).includes("preventDefault"),
    );
    expect(offenders.map(relative)).toEqual([]);
  });

  it("has no overlays laid over the page", () => {
    const offenders = publicFiles.filter((file) =>
      read(file).includes("createPortal"),
    );
    expect(offenders.map(relative)).toEqual([]);
  });

  it("drives page transitions through the browser, not script", () => {
    const offenders = publicFiles
      .filter((file) => read(file).includes("startViewTransition"))
      .map(relative);

    // The theme wipe only changes colours on the same page.
    expect(offenders).toEqual(["components/public/theme-toggle.tsx"]);
  });

  it("adds no client components without a reason", () => {
    const clientFiles = publicFiles
      .filter((file) => read(file).trimStart().startsWith('"use client"'))
      .map(relative)
      .sort();

    expect(clientFiles).toEqual(ALLOWED_CLIENT_COMPONENTS);
  });

  it("doesn't import an animation library", () => {
    const offenders = publicFiles.filter((file) =>
      /from "(framer-motion|motion)/.test(read(file)),
    );
    expect(offenders.map(relative)).toEqual([]);
  });

  it("doesn't redirect from a page, which breaks on Vercel", () => {
    const offenders = publicFiles.filter((file) =>
      /\b(redirect|permanentRedirect)\(/.test(read(file)),
    );
    expect(offenders.map(relative)).toEqual([]);
  });

  it("has no loading.tsx, which would turn 404s into 200s", () => {
    const offenders = sourceFiles(path.join(SOURCE, "app", "(public)")).filter(
      (file) => path.basename(file) === "loading.tsx",
    );
    expect(offenders.map(relative)).toEqual([]);
  });
});
