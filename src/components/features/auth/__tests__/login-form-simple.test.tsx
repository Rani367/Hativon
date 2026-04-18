import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "../login-form";

// Mock auth provider
mock.module("../auth-provider", () => ({
  useAuth: () => ({
    login: mock(() => undefined),
    logout: mock(() => undefined),
    register: mock(() => undefined),
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe("LoginForm - Basic Rendering", () => {
  it("renders without crashing", () => {
    const { container } = render(<LoginForm />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
  });

  it("renders username input", () => {
    render(<LoginForm />);
    const usernameInput = screen.getByLabelText(/שם משתמש/i);
    expect(usernameInput).not.toBeNull();
    expect(usernameInput.getAttribute("type")).toBe("text");
  });

  it("renders password input", () => {
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText(/סיסמה/i);
    expect(passwordInput).not.toBeNull();
    expect(passwordInput.getAttribute("type")).toBe("password");
  });

  it("renders submit button", () => {
    render(<LoginForm />);
    const button = screen.getByRole("button", { name: /התחבר/i });
    expect(button).not.toBeNull();
    expect(button.getAttribute("type")).toBe("submit");
  });

  it("has Hebrew placeholders", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("הזן שם משתמש")).not.toBeNull();
    expect(screen.getByPlaceholderText("הזן סיסמה")).not.toBeNull();
  });

  it("has proper accessibility labels", () => {
    render(<LoginForm />);
    const usernameInput = screen.getByLabelText(/שם משתמש/i);
    const passwordInput = screen.getByLabelText(/סיסמה/i);

    expect(usernameInput.getAttribute("id")).toBe("login-username");
    expect(passwordInput.getAttribute("id")).toBe("login-password");
  });
});
