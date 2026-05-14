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

const { DarkModeAnnouncement } = await import("../dark-mode-announcement");
const { ModeToggle } = await import("../mode-toggle");

const DISMISSAL_KEY = "hativon-dark-mode-announcement-dismissed";
const THEME_KEY = "hativon-theme";

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
  darkModeAnnouncementDismissed: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function renderAnnouncement() {
  return render(
    <DarkModeAnnouncement
      dismissalStorageKey={DISMISSAL_KEY}
      themeStorageKey={THEME_KEY}
    />,
  );
}

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

describe("DarkModeAnnouncement", () => {
  it("shows the announcement when it has not been dismissed", async () => {
    renderAnnouncement();

    expect(
      await screen.findByRole("dialog", { name: "מצב כהה הגיע לחטיבון" }),
    ).not.toBeNull();
  });

  it("stays hidden after local dismissal", async () => {
    window.localStorage.setItem(DISMISSAL_KEY, "true");

    renderAnnouncement();

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("enables dark mode and dismisses permanently", async () => {
    const user = userEvent.setup();
    authState = { loading: false, user: mockUser };

    renderAnnouncement();
    await user.click(
      await screen.findByRole("button", { name: /הפעל מצב כהה/ }),
    );

    expect(setThemeMock).toHaveBeenCalledWith("dark");
    expect(window.localStorage.getItem(DISMISSAL_KEY)).toBe("true");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/user/preferences",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            darkModeAnnouncementDismissed: true,
            themePreference: "dark",
          }),
        }),
      );
    });
    expect(checkAuthMock).toHaveBeenCalled();
  });

  it("dismisses without enabling dark mode", async () => {
    const user = userEvent.setup();

    renderAnnouncement();
    await user.click(await screen.findByRole("button", { name: "לא עכשיו" }));

    expect(setThemeMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(DISMISSAL_KEY)).toBe("true");
  });

  it("syncs local dismissal to the logged-in account", async () => {
    authState = { loading: false, user: mockUser };
    window.localStorage.setItem(DISMISSAL_KEY, "true");

    renderAnnouncement();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/user/preferences",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ darkModeAnnouncementDismissed: true }),
        }),
      );
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses the account theme when there is no local theme", async () => {
    authState = {
      loading: false,
      user: { ...mockUser, themePreference: "dark" },
    };

    renderAnnouncement();

    await waitFor(() => {
      expect(setThemeMock).toHaveBeenCalledWith("dark");
    });
  });

  it("honors account dismissal and writes the local dismissal key", async () => {
    authState = {
      loading: false,
      user: { ...mockUser, darkModeAnnouncementDismissed: true },
    };

    renderAnnouncement();

    await waitFor(() => {
      expect(window.localStorage.getItem(DISMISSAL_KEY)).toBe("true");
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
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
