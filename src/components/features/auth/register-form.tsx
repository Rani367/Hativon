"use client";

import { flushSync } from "react-dom";
import { useEffect, useRef } from "react";
import { createLayout } from "animejs";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  userRegistrationFormSchema,
  type UserRegistrationFormInput,
} from "@/lib/validation/schemas";
import {
  attachHoverLift,
  canUseDomAnimation,
  createMountTimeline,
  motionTokens,
  useAnimeScope,
  useReducedMotionPreference,
} from "@/lib/anime/motion";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const layoutRef = useRef<ReturnType<typeof createLayout> | null>(null);
  const prefersReducedMotion = useReducedMotionPreference();
  const { register: registerUser } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
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

  useEffect(() => {
    if (!canUseDomAnimation() || !formRef.current) {
      return;
    }

    layoutRef.current = createLayout(formRef.current, {
      children: "[data-register-layout-item]",
      duration: 720,
      ease: motionTokens.ease.entrance,
      enterFrom: {
        opacity: 0,
        y: 18,
        scale: 0.97,
      },
      leaveTo: {
        opacity: 0,
        y: -12,
        scale: 0.97,
      },
    });

    return () => {
      layoutRef.current?.revert();
      layoutRef.current = null;
    };
  }, []);

  useAnimeScope(
    formRef,
    ({ root }) => {
      createMountTimeline(root, "[data-register-field]", {
        staggerDelay: 70,
        y: 16,
      });

      return attachHoverLift(root, "[data-register-submit]", {
        lift: -4,
        scale: 1.004,
      });
    },
    [Boolean(errors.root), isSubmitting],
  );

  useAnimeScope(
    formRef,
    ({ root }) => {
      createMountTimeline(root, "[data-register-panel]", {
        staggerDelay: 40,
        y: 18,
      });
    },
    [isTeacher],
  );

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

  const updateTeacherMode = (nextTeacherValue: boolean) => {
    const commitTeacherMode = () => {
      flushSync(() => {
        setValue("isTeacher", nextTeacherValue, {
          shouldDirty: true,
          shouldTouch: true,
        });
        if (nextTeacherValue) {
          setValue("grade", undefined);
          setValue("classNumber", undefined);
        } else {
          setValue("adminPassword", "");
        }
      });
    };

    if (prefersReducedMotion || !layoutRef.current) {
      commitTeacherMode();
      return;
    }

    layoutRef.current.update(commitTeacherMode, {
      duration: 720,
      ease: motionTokens.ease.entrance,
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div data-register-field data-register-layout-item className="space-y-2">
        <Label htmlFor="register-username" className="block text-right">
          שם משתמש
        </Label>
        <Input
          id="register-username"
          type="text"
          {...register("username")}
          disabled={isSubmitting}
          placeholder="אותיות אנגליות ומספרים בלבד"
          className={`text-right transition-all duration-200 focus:scale-[1.01] ${
            errors.username ? "border-destructive" : ""
          }`}
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? "username-error" : "username-help"}
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
          <p id="username-help" className="text-xs text-muted-foreground text-right">
            3-50 תווים (אותיות אנגליות, מספרים וקו תחתון)
          </p>
        )}
      </div>

      <div data-register-field data-register-layout-item className="space-y-2">
        <Label htmlFor="register-displayName" className="block text-right">
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
      </div>

      <div
        data-register-field
        data-register-layout-item
        className="flex items-center justify-end gap-3"
      >
        <Label
          htmlFor="register-isTeacher"
          className="cursor-pointer select-none text-right"
        >
          חשבון צוות / מורה{"\u200F"}
        </Label>
        <Controller
          name="isTeacher"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="register-isTeacher"
              checked={field.value}
              onCheckedChange={(checked) => updateTeacherMode(Boolean(checked))}
              disabled={isSubmitting}
              className="transition-all duration-200 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500"
            />
          )}
        />
      </div>

      {isTeacher ? (
        <div
          data-register-layout-item
          data-register-panel
          className="space-y-3 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/70 p-4"
        >
          <p className="text-right text-sm text-amber-900">
            האפשרות הזו מיועדת למורים ולאנשי צוות בלבד. התלמידים לא צריכים
            לבחור בה.
          </p>
          <Label htmlFor="register-adminPassword" className="block text-right">
            סיסמת צוות מאשרת
          </Label>
          <Input
            id="register-adminPassword"
            type="password"
            {...register("adminPassword")}
            disabled={isSubmitting}
            placeholder="הזן סיסמה שניתנה לצוות"
            className={`text-right transition-all duration-200 focus:scale-[1.01] ${
              errors.adminPassword ? "border-destructive" : ""
            }`}
          />
          {errors.adminPassword && (
            <p className="text-xs text-destructive text-right">
              {errors.adminPassword.message}
            </p>
          )}
        </div>
      ) : (
        <div
          data-register-layout-item
          data-register-panel
          className="flex flex-col gap-4 overflow-hidden sm:flex-row"
        >
          <div className="rounded-xl border bg-muted/40 p-3 text-right text-sm text-muted-foreground sm:col-span-2">
            פרטי הכיתה עוזרים להציג קרדיט נכון לכותבים התלמידים.
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="register-classNumber" className="block text-right">
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
            <Label htmlFor="register-grade" className="block text-right">
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
                  <SelectTrigger id="register-grade" className="w-full" dir="rtl">
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
      )}

      <div data-register-field data-register-layout-item className="space-y-2">
        <Label htmlFor="register-password" className="block text-right">
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
      </div>

      <div data-register-field data-register-layout-item className="space-y-2">
        <Label htmlFor="register-confirmPassword" className="block text-right">
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
      </div>

      {errors.root && (
        <div
          data-register-field
          data-register-layout-item
          className="text-center text-sm text-red-600 dark:text-red-400"
        >
          {errors.root.message}
        </div>
      )}

      <div data-register-field data-register-layout-item data-register-submit>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "נרשם..." : "הרשם"}
        </Button>
      </div>
    </form>
  );
}
