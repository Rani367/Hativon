"use client";

import { type FormEvent, useState } from "react";
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
import { useForm, Controller, useWatch } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { buttonVariants, cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  displayNameSchema,
  usernameSchema,
  userRegistrationFormSchema,
  type UserRegistrationFormInput,
} from "@/lib/validation/schemas";

interface RegisterFormProps {
  onSuccess?: () => void;
}

type RegisterStep = "identity" | "details";

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [step, setStep] = useState<RegisterStep>("identity");

  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    setError: setFormError,
    clearErrors,
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

  const isTeacher = useWatch({
    control,
    name: "isTeacher",
  });

  const stepNumber = step === "identity" ? 1 : 2;

  function setFirstStepError(
    field: "username" | "displayName",
    message: string,
  ) {
    setFormError(field, { message });
  }

  function handleContinue() {
    const values = getValues();
    const usernameResult = usernameSchema.safeParse(values.username);
    const displayNameResult = displayNameSchema.safeParse(values.displayName);

    clearErrors(["username", "displayName", "root"]);

    if (!usernameResult.success) {
      setFirstStepError(
        "username",
        usernameResult.error.issues[0]?.message || "שם משתמש לא תקין",
      );
    }

    if (!displayNameResult.success) {
      setFirstStepError(
        "displayName",
        displayNameResult.error.issues[0]?.message || "שם מלא לא תקין",
      );
    }

    if (usernameResult.success && displayNameResult.success) {
      setStep("details");
    }
  }

  function handleIdentitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleContinue();
  }

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
    <form
      onSubmit={
        step === "details"
          ? handleSubmit(onSubmit)
          : handleIdentitySubmit
      }
      className="flex flex-col gap-3 sm:gap-4"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>שלב {stepNumber} מתוך 2</span>
        <div className="flex gap-1" aria-hidden="true">
          <span
            className={cn(
              "h-1.5 w-8 rounded-full",
              step === "identity" ? "bg-primary" : "bg-primary/30",
            )}
          />
          <span
            className={cn(
              "h-1.5 w-8 rounded-full",
              step === "details" ? "bg-primary" : "bg-primary/30",
            )}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "identity" ? (
          <motion.div
            key="identity"
            className="flex flex-col gap-3"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-username" className="text-right block">
                שם משתמש
              </Label>
              <Input
                id="register-username"
                type="text"
                autoComplete="username"
                {...register("username")}
                disabled={isSubmitting}
                placeholder="אותיות באנגלית, מספרים וקו תחתון"
                className={cn(
                  "min-h-11 text-right transition-all duration-200 sm:min-h-9 sm:focus:scale-[1.01]",
                  errors.username && "border-destructive",
                )}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? "username-error" : undefined}
              />
              {errors.username && (
                <p
                  id="username-error"
                  className="text-xs text-destructive text-right"
                  role="alert"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-displayName" className="text-right block">
                שם מלא
              </Label>
              <Input
                id="register-displayName"
                type="text"
                autoComplete="name"
                {...register("displayName")}
                disabled={isSubmitting}
                placeholder="השם שיוצג בפוסטים שלך"
                className={cn(
                  "min-h-11 text-right transition-all duration-200 sm:min-h-9 sm:focus:scale-[1.01]",
                  errors.displayName && "border-destructive",
                )}
                aria-invalid={!!errors.displayName}
              />
              {errors.displayName && (
                <p className="text-xs text-destructive text-right">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <div
              dir="rtl"
              className="flex min-h-11 items-center justify-start gap-3 rounded-md border bg-muted/40 px-3 text-right sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-0"
            >
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
                      className="size-5 transition-all duration-200 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500 sm:size-4"
                    />
                  </motion.div>
                )}
              />
              <Label
                htmlFor="register-isTeacher"
                className="flex min-h-11 cursor-pointer items-center text-right select-none sm:min-h-0"
              >
                חשבון מורה או צוות
              </Label>
            </div>

            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
            >
              <Button type="button" className="w-full" onClick={handleContinue}>
                המשך
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            className="flex flex-col gap-3"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
          >
            {!isTeacher ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
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
                          className={cn(
                            "min-h-11 w-full sm:min-h-9",
                            errors.classNumber && "border-destructive",
                          )}
                          dir="rtl"
                          aria-invalid={!!errors.classNumber}
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

                <div className="flex min-w-0 flex-col gap-1.5">
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
                          className={cn(
                            "min-h-11 w-full sm:min-h-9",
                            errors.grade && "border-destructive",
                          )}
                          dir="rtl"
                          aria-invalid={!!errors.grade}
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
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="register-adminPassword" className="text-right block">
                  סיסמת צוות מאשרת
                </Label>
                <Input
                  id="register-adminPassword"
                  type="password"
                  {...register("adminPassword")}
                  disabled={isSubmitting}
                  placeholder="הזן סיסמה שניתנה לצוות"
                  className={cn(
                    "min-h-11 text-right transition-all duration-200 sm:min-h-9 sm:focus:scale-[1.01]",
                    errors.adminPassword && "border-destructive",
                  )}
                  aria-invalid={!!errors.adminPassword}
                />
                {errors.adminPassword && (
                  <p className="text-xs text-destructive text-right">
                    {errors.adminPassword.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-password" className="text-right block">
                סיסמה
              </Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                disabled={isSubmitting}
                placeholder="לפחות 8 תווים"
                className={cn(
                  "min-h-11 text-right transition-all duration-200 sm:min-h-9 sm:focus:scale-[1.01]",
                  errors.password && "border-destructive",
                )}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive text-right">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="register-confirmPassword"
                className="text-right block"
              >
                אימות סיסמה
              </Label>
              <Input
                id="register-confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                disabled={isSubmitting}
                placeholder="הזן סיסמה שוב"
                className={cn(
                  "min-h-11 text-right transition-all duration-200 sm:min-h-9 sm:focus:scale-[1.01]",
                  errors.confirmPassword && "border-destructive",
                )}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive text-right">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {errors.root && (
              <motion.div
                className="text-center text-sm text-destructive"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {errors.root.message}
              </motion.div>
            )}

            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setStep("identity")}
              >
                חזרה
              </Button>
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
              >
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "נרשם..." : "הרשם"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
