/**
 * Every cover upload stores two files side by side: posts/<id>/full.webp (or
 * full.gif) and posts/<id>/card.webp. Only the full URL is saved on the post, so
 * the card URL is derived from it. Renaming either file would break every card.
 */
const FULL_IMAGE_PATH = /\/posts\/[^/?#]+\/full\.[^/?#]+$/;

/** The card image for a cover, or the cover itself if it has no card variant. */
export function getPostCardImageUrl(
  imageUrl?: string | null,
): string | undefined {
  if (!imageUrl) return undefined;

  try {
    const url = new URL(imageUrl);
    if (!FULL_IMAGE_PATH.test(url.pathname)) return imageUrl;

    url.pathname = url.pathname.replace(/\/full\.[^/]+$/, "/card.webp");
    return url.toString();
  } catch {
    return imageUrl;
  }
}
