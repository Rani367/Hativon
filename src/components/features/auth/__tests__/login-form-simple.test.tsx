import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "../login-form";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: React.PropsWithChildren) => (
      <button {...props}>{children}</button>
    ),
  },
}));

// Mock auth provider
vi.mock("../auth-provider", () => ({
  useAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe("LoginForm - Basic Rendering", () => {
  it("renders without crashing", () => {
    const { container } = render(<LoginForm />);
    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  it("renders username input", () => {
    render(<LoginForm />);
    const usernameInput = screen.getByLabelText(/שם משתמש/i);
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute("type", "text");
  });

  it("renders password input", () => {
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText(/סיסמה/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("renders submit button", () => {
    render(<LoginForm />);
    const button = screen.getByRole("button", { name: /התחבר/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("has Hebrew placeholders", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("הזן שם משתמש")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("הזן סיסמה")).toBeInTheDocument();
  });

  it("has proper accessibility labels", () => {
    render(<LoginForm />);
    const usernameInput = screen.getByLabelText(/שם משתמש/i);
    const passwordInput = screen.getByLabelText(/סיסמה/i);

    expect(usernameInput).toHaveAttribute("id", "login-username");
    expect(passwordInput).toHaveAttribute("id", "login-password");
  });
});
