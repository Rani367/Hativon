import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

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

mock.module("framer-motion", () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => createMotionComponent(tag),
    },
  ),
}));

mock.module("web-haptics", () => ({
  WebHaptics: class {
    trigger = mock(() => undefined);
  },
}));

const loginMock = mock(() => Promise.resolve({ success: true }));
const registerMock = mock(() => Promise.resolve({ success: true }));

mock.module("../auth-provider", () => ({
  useAuth: () => ({
    checkAuth: mock(() => Promise.resolve()),
    loading: false,
    login: loginMock,
    logout: mock(() => Promise.resolve()),
    register: registerMock,
    user: null,
  }),
}));

const { AuthDialog } = await import("../auth-dialog");
const { LoginForm } = await import("../login-form");
const { RegisterForm } = await import("../register-form");

afterEach(() => {
  cleanup();
});

describe("AuthDialog mobile layout", () => {
  it("renders the auth dialog as a centered mobile dialog", () => {
    render(<AuthDialog open onOpenChange={mock()} />);

    const dialog = screen.getByRole("dialog", { name: "ברוך הבא לחטיבון" });

    expect(dialog).toHaveClass("top-[50%]");
    expect(dialog).toHaveClass("translate-y-[-50%]");
    expect(dialog).toHaveClass("rounded-lg");
    expect(dialog).toHaveClass("max-w-[calc(100%-2rem)]");
    expect(dialog).toHaveClass("pt-2");
    expect(
      screen.getByText(/התחברו או הירשמו כדי לכתוב/),
    ).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toHaveClass("h-11");
    expect(screen.getByRole("button", { name: "סגור" })).toHaveClass("top-0.5");
    expect(dialog.querySelector(".overflow-y-auto")).not.toBeInTheDocument();
  });

  it("switches from login to registration inside the dialog", async () => {
    const user = userEvent.setup();

    render(<AuthDialog open onOpenChange={mock()} />);
    await user.click(screen.getByRole("tab", { name: "הרשמה" }));

    expect(screen.getByLabelText("שם מלא")).toBeInTheDocument();
    expect(screen.getByText("שלב 1 מתוך 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "המשך" })).toBeInTheDocument();
  });
});

describe("RegisterForm mobile interactions", () => {
  it("keeps the teacher account option grouped in RTL order", () => {
    render(<RegisterForm />);

    const checkbox = screen.getByRole("checkbox", {
      name: /חשבון מורה או צוות/,
    });
    const row = checkbox.closest("[dir='rtl']");
    const label = row?.querySelector("label[for='register-isTeacher']");

    expect(row).toBeInTheDocument();
    expect(row).toHaveClass("justify-start");
    expect(row).not.toHaveClass("justify-between");
    expect(label).toHaveTextContent("חשבון מורה או צוות");
    expect(label).not.toHaveClass("flex-1");
    expect(row?.children[0]).toContainElement(checkbox);
    expect(row?.children[1]).toBe(label);
  });

  it("moves teacher registration into a compact second step", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    expect(screen.queryByLabelText("סיסמת צוות מאשרת")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("שם משתמש"), "teacher_1");
    await user.type(screen.getByLabelText("שם מלא"), "מורה בדיקה");
    await user.click(screen.getByRole("checkbox", { name: /חשבון מורה או צוות/ }));
    await user.click(screen.getByRole("button", { name: "המשך" }));

    expect(screen.getByText("שלב 2 מתוך 2")).toBeInTheDocument();
    expect(screen.getByLabelText("סיסמת צוות מאשרת")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "חזרה" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "הרשם" })).toBeInTheDocument();
  });
});

describe("LoginForm forgot password prompt", () => {
  it("opens an accessible username prompt before sending a reset request", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /שכחת סיסמה/ }));

    expect(screen.getByRole("dialog", { name: "איפוס סיסמה" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("שם משתמש")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "שלח בקשה" })).toBeDisabled();
  });
});
