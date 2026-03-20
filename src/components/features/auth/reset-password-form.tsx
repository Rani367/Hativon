"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validation/schemas";
import { buttonVariants } from "@/lib/utils";

type FormState = "validating" | "invalid" | "form" | "submitting" | "success";

export function ResetPasswordForm() {
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

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
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
          <div className="h-7 w-32 rounded bg-muted animate-pulse mx-auto" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse mx-auto" />
          <div className="h-10 rounded bg-muted animate-pulse" />
          <div className="h-10 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <motion.div
        className="w-full max-w-sm rounded-lg border bg-card p-6 text-center space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl font-bold">קישור לא תקין</h1>
        <p className="text-sm text-muted-foreground">
          הקישור אינו תקין או שפג תוקפו. נסה לבקש קישור חדש.
        </p>
        <a
          href="/dashboard"
          className="inline-block text-sm text-primary hover:underline underline-offset-4"
        >
          חזרה להתחברות
        </a>
      </motion.div>
    );
  }

  if (state === "success") {
    return (
      <motion.div
        className="w-full max-w-sm rounded-lg border bg-card p-6 text-center space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl font-bold">הסיסמה שונתה בהצלחה</h1>
        <p className="text-sm text-muted-foreground">
          כעת ניתן להתחבר עם הסיסמה החדשה.
        </p>
        <a
          href="/dashboard"
          className="inline-block text-sm text-primary hover:underline underline-offset-4"
        >
          התחבר
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-sm rounded-lg border bg-card p-6 space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">איפוס סיסמה</h1>
        <p className="text-sm text-muted-foreground">בחר סיסמה חדשה</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} />

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <Label htmlFor="reset-password" className="text-right block">
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
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Label htmlFor="reset-confirm-password" className="text-right block">
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
        </motion.div>

        {errors.root && (
          <motion.div
            className="text-sm text-destructive text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {errors.root.message}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
        >
          <Button
            type="submit"
            className="w-full"
            disabled={state === "submitting"}
          >
            {state === "submitting" ? "מאפס סיסמה..." : "שנה סיסמה"}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
