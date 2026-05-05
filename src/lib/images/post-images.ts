const POST_IMAGE_FULL_PATH_PATTERN = /\/posts\/[^/?#]+\/full\.[^/?#]+$/;

export function getPostCardImageUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) {
    return undefined;
  }

  try {
    const url = new URL(imageUrl);
    if (!POST_IMAGE_FULL_PATH_PATTERN.test(url.pathname)) {
      return imageUrl;
    }

    url.pathname = url.pathname.replace(/\/full\.[^/]+$/, "/card.webp");
    return url.toString();
  } catch {
    if (!POST_IMAGE_FULL_PATH_PATTERN.test(imageUrl)) {
      return imageUrl;
    }

    return imageUrl.replace(/\/full\.[^/?#]+$/, "/card.webp");
  }
}

export function isOptimizedPostCoverUrl(imageUrl?: string | null): boolean {
  if (!imageUrl) {
    return false;
  }

  try {
    return POST_IMAGE_FULL_PATH_PATTERN.test(new URL(imageUrl).pathname);
  } catch {
    return POST_IMAGE_FULL_PATH_PATTERN.test(imageUrl);
  }
}
