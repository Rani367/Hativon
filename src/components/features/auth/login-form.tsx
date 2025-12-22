"use client";

import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userLoginSchema, type UserLoginInput } from "@/lib/validation/schemas";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2 animate-fade-in-up animate-delay-1 will-animate">
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
      </div>

      <div className="space-y-2 animate-fade-in-up animate-delay-2 will-animate">
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
      </div>

      {errors.root && (
        <div className="text-sm text-red-600 dark:text-red-400 text-center animate-scale-in">
          {errors.root.message}
        </div>
      )}

      <div className="animate-fade-in-up animate-delay-3 will-animate">
        <Button
          type="submit"
          className="w-full transition-transform active:scale-[0.98]"
          disabled={isSubmitting}
        >
          {isSubmitting ? "מתחבר..." : "התחבר"}
        </Button>
      </div>
    </form>
  );
}
