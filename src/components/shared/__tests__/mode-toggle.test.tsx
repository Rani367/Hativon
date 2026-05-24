import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@/types/user.types";

const setThemeMock = mock(() => undefined);
const checkAuthMock = mock(() => Promise.resolve());
let resolvedTheme: "light" | "dark" = "light";

let authState: {
  loading: boolean;
  user: User | null;
};

mock.module("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme,
    setTheme: setThemeMock,
  }),
}));

mock.module("web-haptics", () => ({
  WebHaptics: class {
    trigger = mock(() => undefined);
  },
}));

mock.module("@/components/features/auth/auth-provider", () => ({
  useAuth: () => ({
    checkAuth: checkAuthMock,
    loading: authState.loading,
    user: authState.user,
  }),
}));

const { ModeToggle } = await import("../mode-toggle");

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  email: "test@example.com",
  grade: "ח",
  classNumber: 2,
  isTeacher: false,
  passwordResetRequested: false,
  themePreference: "light",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

beforeEach(() => {
  authState = { loading: false, user: null };
  resolvedTheme = "light";
  setThemeMock.mockReset();
  checkAuthMock.mockReset();
  checkAuthMock.mockResolvedValue(undefined);
  window.localStorage.clear();
  global.fetch = mock(() =>
    Promise.resolve(new Response("{}", { status: 200 })),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("ModeToggle", () => {
  it("switches from light to dark", async () => {
    const user = userEvent.setup();

    render(<ModeToggle />);
    await user.click(await screen.findByRole("switch", { name: "הפעל מצב כהה" }));

    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("switches from dark to light", async () => {
    const user = userEvent.setup();
    resolvedTheme = "dark";

    render(<ModeToggle />);
    await user.click(await screen.findByRole("switch", { name: "הפעל מצב בהיר" }));

    expect(setThemeMock).toHaveBeenCalledWith("light");
  });

  it("syncs the selected theme for logged-in users", async () => {
    const user = userEvent.setup();
    authState = { loading: false, user: mockUser };

    render(<ModeToggle />);
    await user.click(await screen.findByRole("switch", { name: "הפעל מצב כהה" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/user/preferences",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ themePreference: "dark" }),
        }),
      );
    });
    expect(checkAuthMock).toHaveBeenCalled();
  });
});
