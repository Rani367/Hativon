export const SITE_NAME = "חטיבון";
export const SITE_DESCRIPTION = "עיתון בית הספר";

/** This account's posts carry the creator label. It grants no other rights. */
export const CREATOR_USERNAME = "rani";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * True only for the CI build, which has no database. A real deployment must
 * never skip: it fails the build instead, leaving the previous version live.
 */
export function shouldSkipPrerender(): boolean {
  return process.env.SKIP_PRERENDER === "1" && !process.env.VERCEL;
}
