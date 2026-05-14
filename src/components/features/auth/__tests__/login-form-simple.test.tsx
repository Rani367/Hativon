import { afterEach, describe, it, expect, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { LoginForm } from "../login-form";

type MotionProps = React.PropsWithChildren<Record<string, unknown>>;

function createMotionComponent(tag: string) {
  return function MotionComponent({
    animate: _animate,
    exit: _exit,
    initial: _initial,
    transition: _transition,
    variants: _variants,
    whileHover: _whileHover,
    whileTap: _whileTap,
    children,
    ...props
  }: MotionProps) {
    return React.createElement(tag, props, children);
  };
}

// Mock framer-motion
mock.module("framer-motion", () => ({
  motion: {
    button: createMotionComponent("button"),
    div: createMotionComponent("div"),
  },
}));

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
  afterEach(() => {
    cleanup();
  });

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
