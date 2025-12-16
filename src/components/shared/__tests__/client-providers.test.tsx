import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientProviders } from "../client-providers";

// Mock the AuthProvider
vi.mock("@/components/features/auth/auth-provider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

describe("ClientProviders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children correctly", () => {
    render(
      <ClientProviders>
        <div data-testid="child">Child Content</div>
      </ClientProviders>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("wraps children with AuthProvider", () => {
    render(
      <ClientProviders>
        <div>Test</div>
      </ClientProviders>,
    );

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <ClientProviders>
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </ClientProviders>,
    );

    expect(screen.getByTestId("first")).toBeInTheDocument();
    expect(screen.getByTestId("second")).toBeInTheDocument();
  });

  it("passes through nested components", () => {
    render(
      <ClientProviders>
        <div>
          <span data-testid="nested">Nested Content</span>
        </div>
      </ClientProviders>,
    );

    expect(screen.getByTestId("nested")).toBeInTheDocument();
  });
});

describe("Service Worker Hook", () => {
  it("is safe when serviceWorker is not available", () => {
    // The component should render without errors even when
    // serviceWorker is not available (like in test environment)
    expect(() => {
      render(
        <ClientProviders>
          <div>Test</div>
        </ClientProviders>,
      );
    }).not.toThrow();
  });

  it("component mounts and unmounts cleanly", () => {
    const { unmount } = render(
      <ClientProviders>
        <div>Test</div>
      </ClientProviders>,
    );

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });
});
