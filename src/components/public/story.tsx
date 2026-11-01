import { getPostCardImageUrl } from "@/lib/images/post-images";
import type { PostSummary } from "@/lib/posts/types";
import { Byline, PostLabels } from "./byline";

interface StoryProps {
  post: PostSummary;
  lead?: boolean;
  /** The first few photos load right away, the rest as they scroll into view. */
  eager?: boolean;
}

/**
 * One story in an issue.
 *
 * The link is a plain <a>, on purpose. A full page load keeps the browser's own
 * back button and scroll position, and the photo morph is a browser feature that
 * can't block navigation. See src/app/(public)/public.css.
 */
export function Story({ post, lead = false, eager = false }: StoryProps) {
  // Cards are 768 pixels wide, which the lead would stretch until it blurs, and
  // their 4:3 crop can lose a portrait's face in a wide frame. The full photo has
  // neither problem.
  const photo = lead ? post.coverImage : getPostCardImageUrl(post.coverImage);

  return (
    <article className={lead ? "story story-lead" : "story"}>
      <a className="story-link" href={`/posts/${post.id}`}>
        {photo ? (
          <span className="story-frame">
            <img
              className="story-photo"
              src={photo}
              alt=""
              width={768}
              height={576}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
            />
          </span>
        ) : null}
        <h2 className="story-title">{post.title}</h2>
        <p className="story-description">{post.description}</p>
      </a>
      <p className="story-meta">
        <Byline post={post} />
        <PostLabels post={post} />
      </p>
    </article>
  );
}
