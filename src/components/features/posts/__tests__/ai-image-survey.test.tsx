import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@/types/user.types";
import type { Post } from "@/types/post.types";

const checkAuthMock = mock(() => Promise.resolve());

let authState: { loading: boolean; user: User | null };

mock.module("@/components/features/auth/auth-provider", () => ({
  useAuth: () => ({
    checkAuth: checkAuthMock,
    loading: authState.loading,
    user: authState.user,
  }),
}));

mock.module("sonner", () => ({
  toast: { success: mock(() => undefined), error: mock(() => undefined) },
}));

mock.module("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span data-slot="thumb">{alt}</span>,
}));

const { AiImageSurvey } = await import("../ai-image-survey");

const baseUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  isTeacher: false,
  themePreference: "light",
  aiImageSurveyDismissed: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-1",
    title: "כתבה עם תמונה",
    content: "תוכן",
    description: "תיאור",
    coverImage: "https://example.com/posts/post-1/full.jpg",
    aiGeneratedImage: false,
    date: "2026-01-01T00:00:00.000Z",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mockFetch(posts: Post[]) {
  const fn = mock((url: string, _opts?: RequestInit) => {
    if (url === "/api/admin/posts") {
      return Promise.resolve(
        new Response(JSON.stringify({ posts }), { status: 200 }),
      );
    }
    return Promise.resolve(new Response("{}", { status: 200 }));
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  authState = { loading: false, user: { ...baseUser } };
  checkAuthMock.mockReset();
  checkAuthMock.mockResolvedValue(undefined);
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("AiImageSurvey", () => {
  it("does not open or fetch for the legacy-admin user", async () => {
    authState = { loading: false, user: { ...baseUser, id: "legacy-admin" } };
    const fetchFn = mockFetch([makePost()]);

    render(<AiImageSurvey />);

    await new Promise((r) => setTimeout(r, 20));
    expect(fetchFn).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not open when the survey was already completed", async () => {
    authState = {
      loading: false,
      user: { ...baseUser, aiImageSurveyDismissed: true },
    };
    const fetchFn = mockFetch([makePost()]);

    render(<AiImageSurvey />);

    await new Promise((r) => setTimeout(r, 20));
    expect(fetchFn).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not open when the user has no image posts", async () => {
    const fetchFn = mockFetch([makePost({ coverImage: undefined })]);

    render(<AiImageSurvey />);

    await waitFor(() => expect(fetchFn).toHaveBeenCalledWith("/api/admin/posts"));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens, saves answers and dismisses on completion", async () => {
    const user = userEvent.setup();
    const fetchFn = mockFetch([makePost()]);

    render(<AiImageSurvey />);

    await screen.findByText("עזרו לנו לסמן תמונות שנוצרו ב-AI");

    // Mark the post as AI-generated, then save.
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "שמירה וסיום" }));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledWith(
        "/api/user/posts/post-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ aiGeneratedImage: true }),
        }),
      );
    });
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/user/preferences",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ aiImageSurveyDismissed: true }),
      }),
    );
    expect(checkAuthMock).toHaveBeenCalled();
    expect(window.sessionStorage.getItem("aiImageSurveySnoozed")).toBeNull();
  });

  it("snoozes (without dismissing) when postponed", async () => {
    const user = userEvent.setup();
    const fetchFn = mockFetch([makePost()]);

    render(<AiImageSurvey />);

    await screen.findByText("עזרו לנו לסמן תמונות שנוצרו ב-AI");
    await user.click(screen.getByRole("button", { name: "אחר כך" }));

    expect(window.sessionStorage.getItem("aiImageSurveySnoozed")).toBe("1");
    // The survey must NOT be permanently dismissed when merely postponed.
    const preferencesCall = fetchFn.mock.calls.find(
      (call) => call[0] === "/api/user/preferences",
    );
    expect(preferencesCall).toBeUndefined();
  });
});
