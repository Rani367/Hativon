const LAST_ISSUE_PATH_KEY = "hativon_last_issue_path";
const MAX_REMEMBERED_ISSUE_AGE_MS = 30 * 60 * 1000;

interface RememberedIssuePath {
  path: string;
  postId: string;
  timestamp: number;
}

export function rememberCurrentIssuePath(postId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;

  if (!currentPath.startsWith("/posts/")) {
    const rememberedIssuePath: RememberedIssuePath = {
      path: currentPath,
      postId,
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(
      LAST_ISSUE_PATH_KEY,
      JSON.stringify(rememberedIssuePath),
    );
  }
}

export function getRememberedIssuePath(postId: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.sessionStorage.getItem(LAST_ISSUE_PATH_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    const rememberedIssuePath = JSON.parse(storedValue) as RememberedIssuePath;
    const isExpired =
      Date.now() - rememberedIssuePath.timestamp > MAX_REMEMBERED_ISSUE_AGE_MS;

    if (
      isExpired ||
      rememberedIssuePath.postId !== postId ||
      rememberedIssuePath.path.startsWith("/posts/")
    ) {
      return null;
    }

    return rememberedIssuePath.path;
  } catch {
    window.sessionStorage.removeItem(LAST_ISSUE_PATH_KEY);
    return null;
  }
}
