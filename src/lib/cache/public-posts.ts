import type { Post } from "@/types/post.types";
import { monthNumberToEnglish } from "@/lib/date/months";
import { resolveMergeGroup } from "@/lib/issues/merged-issues";
import { safeRevalidatePath } from "./revalidate";

type PublicPostSnapshot = Pick<
  Post,
  | "id"
  | "title"
  | "content"
  | "coverImage"
  | "description"
  | "wordCount"
  | "date"
  | "author"
  | "authorGrade"
  | "authorClass"
  | "authorDeleted"
  | "isTeacherPost"
  | "tags"
  | "category"
  | "status"
> | null;

function getPublicSignature(post: PublicPostSnapshot): string | null {
  if (!post || post.status !== "published") {
    return null;
  }

  return JSON.stringify({
    id: post.id,
    title: post.title,
    content: post.content,
    coverImage: post.coverImage || null,
    description: post.description,
    wordCount: post.wordCount ?? null,
    date: post.date,
    author: post.author || null,
    authorGrade: post.authorGrade || null,
    authorClass: post.authorClass || null,
    authorDeleted: post.authorDeleted || false,
    isTeacherPost: post.isTeacherPost || false,
    tags: post.tags || [],
    category: post.category || null,
  });
}

function getArchiveYearMonth(
  post: PublicPostSnapshot,
): { year: number; month: number } | null {
  if (!post || post.status !== "published") {
    return null;
  }

  const date = new Date(post.date);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function archivePathOf(year: number, month: number): string | null {
  const monthEn = monthNumberToEnglish(month);
  return monthEn ? `/${year}/${monthEn}` : null;
}

export async function revalidatePublicPostChange(
  before: PublicPostSnapshot,
  after: PublicPostSnapshot,
) {
  const beforeSignature = getPublicSignature(before);
  const afterSignature = getPublicSignature(after);

  if (beforeSignature === afterSignature) {
    return;
  }

  const paths = new Set<string>(["/", "/api/archives", "/sitemap.xml"]);

  if (before?.id) {
    paths.add(`/posts/${before.id}`);
  }

  if (after?.id) {
    paths.add(`/posts/${after.id}`);
  }

  // Revalidate the affected month page(s), plus — if the month belongs to a
  // merged "double issue" — the canonical page (the real cached page; member
  // months only redirect to it). Dedupe by year-month to avoid repeat lookups.
  const months = new Map<string, { year: number; month: number }>();
  for (const ym of [getArchiveYearMonth(before), getArchiveYearMonth(after)]) {
    if (ym) {
      months.set(`${ym.year}-${ym.month}`, ym);
    }
  }

  for (const { year, month } of months.values()) {
    const ownPath = archivePathOf(year, month);
    if (ownPath) {
      paths.add(ownPath);
    }

    const group = await resolveMergeGroup(year, month);
    if (group) {
      const canonicalPath = archivePathOf(
        group.canonicalYear,
        group.canonicalMonth,
      );
      if (canonicalPath) {
        paths.add(canonicalPath);
      }
    }
  }

  for (const path of paths) {
    safeRevalidatePath(path);
  }
}
