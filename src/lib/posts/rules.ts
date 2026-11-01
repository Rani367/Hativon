import type { User } from "@/lib/users/types";

/** New descriptions only. Older posts keep what they have until it's edited. */
export const MAX_DESCRIPTION_LENGTH = 160;

interface OwnedPost {
  authorId?: string | null;
  teacherHold?: boolean;
}

export function canEditPost(user: User, post: OwnedPost): boolean {
  return user.isTeacher || post.authorId === user.id;
}

/** A teacher who unpublished a post is the only one who can put it back. */
export function canPublishPost(user: User, post: OwnedPost): boolean {
  return canEditPost(user, post) && (user.isTeacher || !post.teacherHold);
}

/**
 * What to store as the post's byline. Students may credit a group, but their own
 * name stays attached, so nobody can publish under someone else's name. Teachers
 * can write anything. A byline nobody changed is left alone, including the many
 * old posts whose author differs from the writer's current name.
 */
export function composeByline(
  user: User,
  requested: string | undefined,
  existing: string | undefined,
): string {
  const name = requested?.trim();

  if (!name) return existing ?? user.displayName;
  if (name === existing || name === user.displayName || user.isTeacher) {
    return name;
  }
  return `${name} (${user.displayName})`;
}

export function truncateDescription(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > MAX_DESCRIPTION_LENGTH
    ? `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd()}...`
    : trimmed;
}

/** The article's opening as plain text, for writers who leave it empty. */
export function generateDescription(content: string): string {
  return truncateDescription(
    content
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#*_~\[\]()]/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " "),
  );
}
