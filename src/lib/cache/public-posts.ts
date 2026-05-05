import type { Post } from "@/types/post.types";
import { monthNumberToEnglish } from "@/lib/date/months";
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

function getArchivePath(post: PublicPostSnapshot): string | null {
  if (!post || post.status !== "published") {
    return null;
  }

  const date = new Date(post.date);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const month = monthNumberToEnglish(date.getUTCMonth() + 1);
  if (!month) {
    return null;
  }

  return `/${date.getUTCFullYear()}/${month}`;
}

export function revalidatePublicPostChange(
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

  const beforeArchivePath = getArchivePath(before);
  if (beforeArchivePath) {
    paths.add(beforeArchivePath);
  }

  const afterArchivePath = getArchivePath(after);
  if (afterArchivePath) {
    paths.add(afterArchivePath);
  }

  for (const path of paths) {
    safeRevalidatePath(path);
  }
}
