"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { buttonVariants } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userLoginSchema, type UserLoginInput } from "@/lib/validation/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
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
      // Silently handle - we show the same message regardless
    }
    setPromptOpen(false);
    setForgotState("sent");
  }

  function handleForgotClick() {
    const currentUsername = getValues("username")?.trim();
    if (currentUsername) {
      sendResetRequest(currentUsername);
    } else {
      setForgotUsername("");
      setPromptOpen(true);
      setForgotState("prompt");
    }
  }

  function handlePromptSubmit() {
    const trimmed = forgotUsername.trim();
    if (trimmed) {
      sendResetRequest(trimmed);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <Label htmlFor="login-username" className="text-right block">
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
            <p className="text-sm text-red-600 dark:text-red-400 text-right">
              {errors.username.message}
            </p>
          )}
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Label htmlFor="login-password" className="text-right block">
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
            <p className="text-sm text-red-600 dark:text-red-400 text-right">
              {errors.password.message}
            </p>
          )}
        </motion.div>

        <motion.div
          className="text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.3 }}
        >
          <button
            type="button"
            onClick={handleForgotClick}
            disabled={forgotState === "sending"}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer disabled:opacity-50"
          >
            {forgotState === "sending" ? "שולח בקשה..." : "שכחת סיסמה?"}
          </button>
        </motion.div>

        {forgotState === "sent" && (
          <motion.div
            className="text-sm text-center rounded-md bg-muted p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            בקשת איפוס סיסמה נשלחה. פנה למורה או מנהל כדי שיאפסו את הסיסמה
            שלך.
          </motion.div>
        )}

        {errors.root && (
          <motion.div
            className="text-sm text-red-600 dark:text-red-400 text-center"
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "מתחבר..." : "התחבר"}
          </Button>
        </motion.div>
      </form>

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
              onChange={(e) => setForgotUsername(e.target.value)}
              placeholder="שם משתמש"
              className="text-right"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
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
