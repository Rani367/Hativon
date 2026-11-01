import { copy } from "@/lib/copy";
import type { PostSummary } from "@/lib/posts/types";

type BylinePost = Pick<
  PostSummary,
  "author" | "authorDeleted" | "authorGrade" | "authorClass"
>;

/** "מאת דנה לוי, כיתה ז2". Renders nothing for a post with no author. */
export function Byline({ post }: { post: BylinePost }) {
  if (!post.author) return null;

  const grade =
    post.authorGrade && post.authorClass
      ? copy.article.grade(post.authorGrade, post.authorClass)
      : null;

  return (
    <span className="byline">
      {copy.article.byline(post.author)}
      {post.authorDeleted ? ` ${copy.article.deletedAuthor}` : null}
      {grade ? `, ${grade}` : null}
    </span>
  );
}

type LabelledPost = Pick<
  PostSummary,
  "isCreatorPost" | "isTeacherPost" | "aiGeneratedImage"
>;

/** Plain text labels. The old coloured badges would break the black and white. */
export function PostLabels({ post }: { post: LabelledPost }) {
  const labels = [
    post.isCreatorPost
      ? copy.labels.creator
      : post.isTeacherPost
        ? copy.labels.teacher
        : null,
    post.aiGeneratedImage ? copy.labels.aiImage : null,
  ].filter(Boolean);

  if (labels.length === 0) return null;

  return (
    <span className="post-labels">
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </span>
  );
}
