"use client";

import { useRef, useState } from "react";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { triggerHaptic } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userLoginSchema, type UserLoginInput } from "@/lib/validation/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  attachHoverLift,
  createMountTimeline,
  useAnimeScope,
} from "@/lib/anime/motion";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const [forgotState, setForgotState] = useState<
    "idle" | "prompt" | "sending" | "sent"
  >("idle");
  const [forgotUsername, setForgotUsername] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<UserLoginInput>({
    resolver: zodResolver(userLoginSchema),
  });

  useAnimeScope(
    formRef,
    ({ root }) => {
      createMountTimeline(root, "[data-login-field]", {
        staggerDelay: 75,
        y: 16,
      });

      return attachHoverLift(root, "[data-login-submit]", {
        lift: -4,
        scale: 1.004,
      });
    },
    [forgotState, Boolean(errors.root), isSubmitting],
  );

  const onSubmit = async (data: UserLoginInput) => {
    try {
      const result = await login(data);

      if (result.success) {
        onSuccess?.();
      } else {
        setFormError("root", {
          message: result.message || "התחברות נכשלה",
        });
      }
    } catch {
      setFormError("root", {
        message: "שגיאה בהתחברות. אנא נסה שנית.",
      });
    }
  };

  async function sendResetRequest(username: string) {
    setForgotState("sending");
    try {
      await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
    } catch {
      // We intentionally show the same success copy regardless.
    }
    setPromptOpen(false);
    setForgotState("sent");
  }

  function handleForgotClick() {
    const currentUsername = getValues("username")?.trim();
    if (currentUsername) {
      void sendResetRequest(currentUsername);
    } else {
      setForgotUsername("");
      setPromptOpen(true);
      setForgotState("prompt");
    }
  }

  function handlePromptSubmit() {
    const trimmed = forgotUsername.trim();
    if (trimmed) {
      void sendResetRequest(trimmed);
    }
  }

  return (
    <>
      <div ref={formRef}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div data-login-field className="space-y-2">
            <Label htmlFor="login-username" className="block text-right">
              שם משתמש
            </Label>
            <Input
              id="login-username"
              type="text"
              {...register("username")}
              disabled={isSubmitting}
              placeholder="הזן שם משתמש"
              className="text-right transition-all duration-200 focus:scale-[1.01]"
            />
            {errors.username && (
              <p className="text-sm text-destructive text-right">
                {errors.username.message}
              </p>
            )}
          </div>

          <div data-login-field className="space-y-2">
            <Label htmlFor="login-password" className="block text-right">
              סיסמה
            </Label>
            <Input
              id="login-password"
              type="password"
              {...register("password")}
              disabled={isSubmitting}
              placeholder="הזן סיסמה"
              className="text-right transition-all duration-200 focus:scale-[1.01]"
            />
            {errors.password && (
              <p className="text-sm text-destructive text-right">
                {errors.password.message}
              </p>
            )}
          </div>

          <div data-login-field className="text-right">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                handleForgotClick();
              }}
              disabled={forgotState === "sending"}
              className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4 disabled:opacity-50"
            >
              {forgotState === "sending" ? "שולח בקשה..." : "שכחת סיסמה?\u200F"}
            </button>
          </div>

          {forgotState === "sent" && (
            <div
              data-login-field
              className="rounded-md bg-muted p-3 text-center text-sm"
            >
              בקשת איפוס הסיסמה נשלחה. מורה או איש צוות עם גישת ניהול יוכלו
              לטפל בה ולשלוח אליך קישור בטוח לאיפוס.
            </div>
          )}

          {errors.root && (
            <div
              data-login-field
              className="text-center text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          )}

          <div data-login-field data-login-submit>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "מתחבר..." : "התחבר"}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">איפוס סיסמה</DialogTitle>
            <DialogDescription className="text-right">
              הזן את שם המשתמש שלך כדי לשלוח בקשת איפוס סיסמה
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={forgotUsername}
              onChange={(event) => setForgotUsername(event.target.value)}
              placeholder="שם משתמש"
              className="text-right"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handlePromptSubmit();
                }
              }}
            />
            <Button
              onClick={handlePromptSubmit}
              disabled={!forgotUsername.trim()}
              className="w-full"
            >
              שלח בקשה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
