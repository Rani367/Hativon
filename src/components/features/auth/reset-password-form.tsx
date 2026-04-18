"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validation/schemas";
import {
  attachHoverLift,
  createMountTimeline,
  useAnimeScope,
} from "@/lib/anime/motion";

type FormState = "validating" | "invalid" | "form" | "submitting" | "success";

export function ResetPasswordForm() {
  const cardRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<FormState>("validating");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || "" },
  });

  useAnimeScope(
    cardRef,
    ({ root }) => {
      createMountTimeline(root, "[data-reset-field]", {
        staggerDelay: 80,
        y: 18,
      });

      return attachHoverLift(root, "[data-reset-submit]", {
        lift: -4,
        scale: 1.004,
      });
    },
    [state, Boolean(errors.root)],
  );

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((data) => {
        setState(data.valid ? "form" : "invalid");
      })
      .catch(() => {
        setState("invalid");
      });
  }, [token]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setState("submitting");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.token, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setState("form");
        setFormError("root", {
          message: result.error || "שגיאה באיפוס הסיסמה",
        });
        return;
      }

      setState("success");
    } catch {
      setState("form");
      setFormError("root", {
        message: "שגיאה באיפוס הסיסמה. אנא נסה שנית.",
      });
    }
  };

  if (state === "validating") {
    return (
      <div className="w-full max-w-sm rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div className="mx-auto h-7 w-32 rounded bg-muted animate-pulse" />
          <div className="mx-auto h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="h-10 rounded bg-muted animate-pulse" />
          <div className="h-10 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div
        ref={cardRef}
        className="w-full max-w-sm space-y-4 rounded-[1.5rem] border bg-card/86 p-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm"
      >
        <h1 data-reset-field className="text-xl font-bold">
          קישור לא תקין
        </h1>
        <p data-reset-field className="text-sm text-muted-foreground">
          הקישור אינו תקין או שפג תוקפו. נסה לבקש קישור חדש.
        </p>
        <a
          data-reset-field
          href="/dashboard"
          className="inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          חזרה להתחברות
        </a>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div
        ref={cardRef}
        className="w-full max-w-sm space-y-4 rounded-[1.5rem] border bg-card/86 p-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm"
      >
        <h1 data-reset-field className="text-xl font-bold">
          הסיסמה שונתה בהצלחה
        </h1>
        <p data-reset-field className="text-sm text-muted-foreground">
          כעת ניתן להתחבר עם הסיסמה החדשה.
        </p>
        <a
          data-reset-field
          href="/dashboard"
          className="inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          התחבר
        </a>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="w-full max-w-sm space-y-6 rounded-[1.75rem] border bg-card/86 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-sm"
    >
      <div data-reset-field className="space-y-1 text-center">
        <h1 className="text-xl font-bold">איפוס סיסמה</h1>
        <p className="text-sm text-muted-foreground">בחר סיסמה חדשה</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div data-reset-field className="space-y-2">
          <Label htmlFor="reset-password" className="block text-right">
            סיסמה חדשה
          </Label>
          <Input
            id="reset-password"
            type="password"
            {...register("password")}
            disabled={state === "submitting"}
            placeholder="לפחות 8 תווים"
            className="text-right transition-all duration-200 focus:scale-[1.01]"
          />
          {errors.password && (
            <p className="text-sm text-destructive text-right">
              {errors.password.message}
            </p>
          )}
        </div>

        <div data-reset-field className="space-y-2">
          <Label htmlFor="reset-confirm-password" className="block text-right">
            אימות סיסמה
          </Label>
          <Input
            id="reset-confirm-password"
            type="password"
            {...register("confirmPassword")}
            disabled={state === "submitting"}
            placeholder="הזן שוב את הסיסמה"
            className="text-right transition-all duration-200 focus:scale-[1.01]"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive text-right">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {errors.root && (
          <div data-reset-field className="text-center text-sm text-destructive">
            {errors.root.message}
          </div>
        )}

        <div data-reset-field data-reset-submit>
          <Button
            type="submit"
            className="w-full"
            disabled={state === "submitting"}
          >
            {state === "submitting" ? "מאפס סיסמה..." : "שנה סיסמה"}
          </Button>
        </div>
      </form>
    </div>
  );
}
