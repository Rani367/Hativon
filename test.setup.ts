import { mock, expect } from "bun:test";

const { GlobalWindow } = await import(
  Bun.resolveSync("happy-dom", process.cwd()),
);
const jestDomMatchers = await import(
  Bun.resolveSync("@testing-library/jest-dom/matchers", process.cwd()),
);

expect.extend(jestDomMatchers);

const happyWindow = new GlobalWindow({ url: "http://localhost:3000" });
const domGlobals = [
  "document",
  "window",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLFormElement",
  "HTMLButtonElement",
  "HTMLDivElement",
  "HTMLSpanElement",
  "HTMLAnchorElement",
  "HTMLLabelElement",
  "Node",
  "Element",
  "Event",
  "CustomEvent",
  "MouseEvent",
  "KeyboardEvent",
  "InputEvent",
  "FocusEvent",
  "MutationObserver",
  "IntersectionObserver",
  "navigator",
  "location",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "DOMParser",
  "XMLSerializer",
  "Text",
  "DocumentFragment",
  "NodeFilter",
  "TreeWalker",
  "Range",
  "Selection",
  "HTMLCollection",
  "NodeList",
  "CSSStyleDeclaration",
];

for (const key of domGlobals) {
  if (!(key in globalThis) && key in happyWindow) {
    (globalThis as Record<string, unknown>)[key] =
      (happyWindow as unknown as Record<string, unknown>)[key];
  }
}

const _g = globalThis as Record<string, unknown>;

_g.__dbQueryMock = mock(() => Promise.resolve({ rows: [] }));
_g.__isDatabaseAvailableMock = mock(() => Promise.resolve(true));
_g.__logErrorMock = mock(() => undefined);
_g.__checkRateLimitMock = mock(() => Promise.resolve({ limited: false }));
_g.__createRateLimiterMock = mock(() => ({
  check: mock(() =>
    Promise.resolve({ success: true, remaining: 5, reset: Date.now() + 60000 }),
  ),
}));
_g.__getClientIdentifierMock = mock(() => "test-ip");

mock.module("@/lib/db/client", () => ({
  db: {
    query: (...args: unknown[]) =>
      (_g.__dbQueryMock as (...a: unknown[]) => unknown)(...args),
  },
  isDatabaseAvailable: (...args: unknown[]) =>
    (_g.__isDatabaseAvailableMock as (...a: unknown[]) => unknown)(...args),
}));

mock.module("@/lib/logger", () => ({
  logError: (...args: unknown[]) =>
    (_g.__logErrorMock as (...a: unknown[]) => unknown)(...args),
}));

const _realQueriesModule = require("@/lib/posts/queries");
const _realGetPosts = _realQueriesModule.getPosts;
const _realGetPostById = _realQueriesModule.getPostById;
const _realGetPublishedPostById = _realQueriesModule.getPublishedPostById;
const _realGetPostsByAuthor = _realQueriesModule.getPostsByAuthor;
const _realGetPostsByMonth = _realQueriesModule.getPostsByMonth;
const _realGetArchiveMonths = _realQueriesModule.getArchiveMonths;
const _realGetPostStats = _realQueriesModule.getPostStats;

_g.__realPostsQueries = {
  getPosts: _realGetPosts,
  getPostById: _realGetPostById,
  getPublishedPostById: _realGetPublishedPostById,
  getPostsByAuthor: _realGetPostsByAuthor,
  getPostsByMonth: _realGetPostsByMonth,
  getArchiveMonths: _realGetArchiveMonths,
  getPostStats: _realGetPostStats,
};

_g.__postsQueriesGetPostsMock = _realGetPosts;
_g.__postsQueriesGetPostByIdMock = _realGetPostById;
_g.__postsQueriesGetPublishedPostByIdMock = _realGetPublishedPostById;
_g.__postsQueriesGetPostsByAuthorMock = _realGetPostsByAuthor;
_g.__postsQueriesGetPostsByMonthMock = _realGetPostsByMonth;
_g.__postsQueriesGetArchiveMonthsMock = _realGetArchiveMonths;
_g.__postsQueriesGetPostStatsMock = _realGetPostStats;

mock.module("@/lib/posts/queries", () => ({
  getPosts: (...args: unknown[]) =>
    (_g.__postsQueriesGetPostsMock as (...a: unknown[]) => unknown)(...args),
  getPostById: (...args: unknown[]) =>
    (_g.__postsQueriesGetPostByIdMock as (...a: unknown[]) => unknown)(...args),
  getPublishedPostById: (...args: unknown[]) =>
    (_g.__postsQueriesGetPublishedPostByIdMock as (...a: unknown[]) => unknown)(...args),
  getPostsByAuthor: (...args: unknown[]) =>
    (_g.__postsQueriesGetPostsByAuthorMock as (...a: unknown[]) => unknown)(...args),
  getPostsByMonth: (...args: unknown[]) =>
    (_g.__postsQueriesGetPostsByMonthMock as (...a: unknown[]) => unknown)(...args),
  getArchiveMonths: (...args: unknown[]) =>
    (_g.__postsQueriesGetArchiveMonthsMock as (...a: unknown[]) => unknown)(...args),
  getPostStats: (...args: unknown[]) =>
    (_g.__postsQueriesGetPostStatsMock as (...a: unknown[]) => unknown)(...args),
}));

_g.__postsBarrelGetAllPostsMock = mock(() => Promise.resolve([]));
_g.__postsBarrelGetPostByIdMock = mock(() => Promise.resolve(null));
_g.__postsBarrelGetPublishedPostByIdMock = mock(() => Promise.resolve(null));
_g.__postsBarrelGetPostsByAuthorMock = mock(() => Promise.resolve([]));
_g.__postsBarrelGetPostStatsMock = mock(() =>
  Promise.resolve({ total: 0, published: 0, drafts: 0, today: 0, thisWeek: 0, thisMonth: 0 }),
);
_g.__postsBarrelGetPostsMock = mock(() => Promise.resolve([]));
_g.__postsBarrelGetPostMock = mock(() => Promise.resolve(null));
_g.__postsBarrelGetWordCountMock = mock(() => 0);
_g.__postsBarrelCreatePostMock = mock(() => Promise.resolve({}));
_g.__postsBarrelUpdatePostMock = mock(() => Promise.resolve(null));
_g.__postsBarrelDeletePostMock = mock(() => Promise.resolve(false));
_g.__postsBarrelCanUserEditPostMock = mock(() => false);
_g.__postsBarrelCanUserDeletePostMock = mock(() => false);
_g.__postsBarrelGenerateDescriptionMock = mock(() => "");
_g.__postsBarrelRowToPostMock = mock(() => ({}));

mock.module("@/lib/posts", () => ({
  getAllPosts: (...args: unknown[]) =>
    (_g.__postsBarrelGetAllPostsMock as (...a: unknown[]) => unknown)(...args),
  getPostById: (...args: unknown[]) =>
    (_g.__postsBarrelGetPostByIdMock as (...a: unknown[]) => unknown)(...args),
  getPublishedPostById: (...args: unknown[]) =>
    (_g.__postsBarrelGetPublishedPostByIdMock as (...a: unknown[]) => unknown)(...args),
  getPostsByAuthor: (...args: unknown[]) =>
    (_g.__postsBarrelGetPostsByAuthorMock as (...a: unknown[]) => unknown)(...args),
  getPostStats: (...args: unknown[]) =>
    (_g.__postsBarrelGetPostStatsMock as (...a: unknown[]) => unknown)(...args),
  getPosts: (...args: unknown[]) =>
    (_g.__postsBarrelGetPostsMock as (...a: unknown[]) => unknown)(...args),
  getPost: (...args: unknown[]) =>
    (_g.__postsBarrelGetPostMock as (...a: unknown[]) => unknown)(...args),
  getWordCount: (...args: unknown[]) =>
    (_g.__postsBarrelGetWordCountMock as (...a: unknown[]) => unknown)(...args),
  createPost: (...args: unknown[]) =>
    (_g.__postsBarrelCreatePostMock as (...a: unknown[]) => unknown)(...args),
  updatePost: (...args: unknown[]) =>
    (_g.__postsBarrelUpdatePostMock as (...a: unknown[]) => unknown)(...args),
  deletePost: (...args: unknown[]) =>
    (_g.__postsBarrelDeletePostMock as (...a: unknown[]) => unknown)(...args),
  canUserEditPost: (...args: unknown[]) =>
    (_g.__postsBarrelCanUserEditPostMock as (...a: unknown[]) => unknown)(...args),
  canUserDeletePost: (...args: unknown[]) =>
    (_g.__postsBarrelCanUserDeletePostMock as (...a: unknown[]) => unknown)(...args),
  generateDescription: (...args: unknown[]) =>
    (_g.__postsBarrelGenerateDescriptionMock as (...a: unknown[]) => unknown)(...args),
  rowToPost: (...args: unknown[]) =>
    (_g.__postsBarrelRowToPostMock as (...a: unknown[]) => unknown)(...args),
  MAX_DESCRIPTION_LENGTH: 300,
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: mock(() => undefined),
    replace: mock(() => undefined),
    back: mock(() => undefined),
    forward: mock(() => undefined),
    refresh: mock(() => undefined),
    prefetch: mock(() => undefined),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

mock.module("next/headers", () => ({
  cookies: mock(() => ({
    get: mock(() => undefined),
    set: mock(() => undefined),
    delete: mock(() => undefined),
    has: mock(() => undefined),
    getAll: mock(() => undefined),
  })),
  headers: mock(() => new Map()),
}));

mock.module("next/cache", () => ({
  revalidateTag: mock(() => undefined),
  revalidatePath: mock(() => undefined),
  unstable_cache: mock(
    (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
  ),
}));

process.env.JWT_SECRET = "test-jwt-secret-key-at-least-32-chars";
process.env.ADMIN_PASSWORD = "test-admin-password";

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof globalThis.ResizeObserver;

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0]?.toString() || "";
  if (
    message.includes("Warning: ReactDOM.render is deprecated") ||
    message.includes("Warning: useLayoutEffect does nothing on the server")
  ) {
    return;
  }
  originalConsoleError(...args);
};
