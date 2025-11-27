"use client";

import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { buttonVariants } from "@/lib/utils";
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
  );
}
