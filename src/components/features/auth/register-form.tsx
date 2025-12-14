"use client";

import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { buttonVariants } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  userRegistrationFormSchema,
  type UserRegistrationFormInput,
} from "@/lib/validation/schemas";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<UserRegistrationFormInput>({
    resolver: zodResolver(userRegistrationFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      grade: undefined,
      classNumber: undefined,
      isTeacher: false,
      adminPassword: "",
    },
  });

  const isTeacher = watch("isTeacher");

  const onSubmit = async (data: UserRegistrationFormInput) => {
    try {
      const result = await registerUser({
        username: data.username,
        password: data.password,
        displayName: data.displayName,
        grade: data.isTeacher ? undefined : data.grade,
        classNumber: data.isTeacher ? undefined : data.classNumber,
        isTeacher: data.isTeacher,
        adminPassword: data.isTeacher ? data.adminPassword : undefined,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setFormError("root", {
          message: result.message || "הרשמה נכשלה",
        });
      }
    } catch {
      setFormError("root", {
        message: "שגיאה בהרשמה. אנא נסה שנית.",
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
        <Label htmlFor="register-username" className="text-right block">
          שם משתמש
        </Label>
        <Input
          id="register-username"
          type="text"
          {...register("username")}
          disabled={isSubmitting}
          placeholder="אותיות אנגליות ומספרים בלבד"
          className={`text-right transition-all duration-200 focus:scale-[1.01] ${errors.username ? "border-destructive" : ""}`}
          aria-invalid={!!errors.username}
          aria-describedby={
            errors.username ? "username-error" : "username-help"
          }
        />
        {errors.username ? (
          <p
            id="username-error"
            className="text-xs text-destructive text-right"
            role="alert"
          >
            {errors.username.message}
          </p>
        ) : (
          <p
            id="username-help"
            className="text-xs text-muted-foreground text-right"
          >
            3-50 תווים (אותיות אנגליות, מספרים וקו תחתון)
          </p>
        )}
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Label htmlFor="register-displayName" className="text-right block">
          שם מלא
        </Label>
        <Input
          id="register-displayName"
          type="text"
          {...register("displayName")}
          disabled={isSubmitting}
          placeholder="השם שיוצג בפוסטים שלך"
          className="text-right transition-all duration-200 focus:scale-[1.01]"
        />
        {errors.displayName && (
          <p className="text-xs text-destructive text-right">
            {errors.displayName.message}
          </p>
        )}
      </motion.div>

      <motion.div
        className="flex items-center justify-end gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
      >
        <Label
          htmlFor="register-isTeacher"
          className="text-right cursor-pointer select-none"
        >
          מורה?
        </Label>
        <Controller
          name="isTeacher"
          control={control}
          render={({ field }) => (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Checkbox
                id="register-isTeacher"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
                className="transition-all duration-200 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
            </motion.div>
          )}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {isTeacher && (
          <motion.div
            className="space-y-2 overflow-hidden"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.2 },
            }}
          >
            <Label
              htmlFor="register-adminPassword"
              className="text-right block"
            >
              סיסמת מנהל
            </Label>
            <Input
              id="register-adminPassword"
              type="password"
              {...register("adminPassword")}
              disabled={isSubmitting}
              placeholder="הזן סיסמת מנהל לאימות"
              className={`text-right transition-all duration-200 focus:scale-[1.01] ${errors.adminPassword ? "border-destructive" : ""}`}
            />
            {errors.adminPassword && (
              <p className="text-xs text-destructive text-right">
                {errors.adminPassword.message}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isTeacher && (
          <motion.div
            className="flex flex-col sm:flex-row gap-4 overflow-hidden"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.2 },
            }}
          >
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="register-classNumber"
                className="text-right block"
              >
                מספר כיתה
              </Label>
              <Controller
                name="classNumber"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="register-classNumber"
                      className="w-full"
                      dir="rtl"
                    >
                      <SelectValue placeholder="בחר מספר" />
                    </SelectTrigger>
                    <SelectContent className="text-right" dir="rtl">
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.classNumber && (
                <p className="text-xs text-destructive text-right">
                  {errors.classNumber.message}
                </p>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="register-grade" className="text-right block">
                כיתה
              </Label>
              <Controller
                name="grade"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="register-grade"
                      className="w-full"
                      dir="rtl"
                    >
                      <SelectValue placeholder="בחר כיתה" />
                    </SelectTrigger>
                    <SelectContent className="text-right" dir="rtl">
                      <SelectItem value="ז">כיתה ז</SelectItem>
                      <SelectItem value="ח">כיתה ח</SelectItem>
                      <SelectItem value="ט">כיתה ט</SelectItem>
                      <SelectItem value="י">כיתה י</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.grade && (
                <p className="text-xs text-destructive text-right">
                  {errors.grade.message}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Label htmlFor="register-password" className="text-right block">
          סיסמה
        </Label>
        <Input
          id="register-password"
          type="password"
          {...register("password")}
          disabled={isSubmitting}
          placeholder="לפחות 8 תווים"
          className="text-right transition-all duration-200 focus:scale-[1.01]"
        />
        {errors.password && (
          <p className="text-xs text-destructive text-right">
            {errors.password.message}
          </p>
        )}
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <Label htmlFor="register-confirmPassword" className="text-right block">
          אימות סיסמה
        </Label>
        <Input
          id="register-confirmPassword"
          type="password"
          {...register("confirmPassword")}
          disabled={isSubmitting}
          placeholder="הזן סיסמה שוב"
          className="text-right transition-all duration-200 focus:scale-[1.01]"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive text-right">
            {errors.confirmPassword.message}
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
        transition={{ delay: 0.3, duration: 0.3 }}
        whileHover="hover"
        whileTap="tap"
        variants={buttonVariants}
      >
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "נרשם..." : "הרשם"}
        </Button>
      </motion.div>
    </form>
  );
}
