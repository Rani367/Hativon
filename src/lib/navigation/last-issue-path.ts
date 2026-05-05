const LAST_ISSUE_PATH_KEY = "hativon_last_issue_path";
const ISSUE_FORWARD_POST_STATE_KEY = "__hativonIssueForwardPost";
const MAX_REMEMBERED_ISSUE_AGE_MS = 30 * 60 * 1000;

interface RememberedIssuePath {
  path: string;
  postId: string;
  timestamp: number;
}

interface IssueForwardPostState {
  href: string;
  issuePath: string;
  postId: string;
  timestamp: number;
}

function getPostIdFromPathname(pathname: string): string | null {
  const [resource, postId] = pathname.split("/").filter(Boolean);
  if (resource !== "posts" || !postId) {
    return null;
  }

  try {
    return decodeURIComponent(postId);
  } catch {
    return postId;
  }
}

function getCurrentPath() {
  return window.location.pathname + window.location.search + window.location.hash;
}

function normalizePostHref(href: string) {
  return new URL(href, window.location.origin).pathname;
}

function isObjectState(
  state: unknown,
): state is Record<string, unknown> {
  return state !== null && typeof state === "object" && !Array.isArray(state);
}

function getForwardPostState(): IssueForwardPostState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const historyState = window.history.state;
  if (!isObjectState(historyState)) {
    return null;
  }

  const forwardPostState = historyState[ISSUE_FORWARD_POST_STATE_KEY];
  if (!isObjectState(forwardPostState)) {
    return null;
  }

  const { href, issuePath, postId, timestamp } = forwardPostState;
  if (
    typeof href !== "string" ||
    typeof issuePath !== "string" ||
    typeof postId !== "string" ||
    typeof timestamp !== "number"
  ) {
    return null;
  }

  return { href, issuePath, postId, timestamp };
}

function rememberForwardPost(postId: string, postHref: string, issuePath: string) {
  const nextHistoryState = isObjectState(window.history.state)
    ? { ...window.history.state }
    : {};

  nextHistoryState[ISSUE_FORWARD_POST_STATE_KEY] = {
    href: normalizePostHref(postHref),
    issuePath,
    postId,
    timestamp: Date.now(),
  } satisfies IssueForwardPostState;

  window.history.replaceState(nextHistoryState, "", issuePath);
}

export function rememberCurrentIssuePath(
  postId: string,
  postHref = `/posts/${encodeURIComponent(postId)}`,
) {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = getCurrentPath();

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
    rememberForwardPost(postId, postHref, currentPath);
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

export function getRememberedIssuePathForCurrentPost(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const postId = getPostIdFromPathname(window.location.pathname);
  return postId ? getRememberedIssuePath(postId) : null;
}

export function canRestoreForwardPost(postId: string, postHref: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const forwardPostState = getForwardPostState();
  if (!forwardPostState) {
    return false;
  }

  const isExpired =
    Date.now() - forwardPostState.timestamp > MAX_REMEMBERED_ISSUE_AGE_MS;

  return (
    !isExpired &&
    forwardPostState.postId === postId &&
    forwardPostState.href === normalizePostHref(postHref) &&
    forwardPostState.issuePath === getCurrentPath() &&
    window.history.length > 1
  );
}
