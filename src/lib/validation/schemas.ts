/**
 * Zod validation schemas for runtime type validation
 * Provides detailed field-level error messages for API requests
 */

import { z } from "zod";

/**
 * User validation schemas
 */

// Grade validation
export const gradeSchema = z.enum(["ז", "ח", "ט", "י"], {
  message: "כיתה חייבת להיות ז, ח, ט או י",
});

// Class number validation
export const classNumberSchema = z
  .union([
    z.number().int().min(1).max(4),
    z
      .string()
      .regex(/^[1-4]$/)
      .transform(Number),
  ])
  .refine((val) => val >= 1 && val <= 4, {
    message: "מספר כיתה חייב להיות בין 1 ל-4",
  });

// Username validation
export const usernameSchema = z
  .string({ message: "שם משתמש נדרש" })
  .min(3, "שם משתמש חייב להיות לפחות 3 תווים")
  .max(50, "שם משתמש לא יכול להיות יותר מ-50 תווים")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "שם משתמש יכול להכיל רק אותיות אנגליות, מספרים וקו תחתון",
  );

// Password validation
export const passwordSchema = z
  .string({ message: "סיסמה נדרשת" })
  .min(8, "סיסמה חייבת להיות לפחות 8 תווים")
  .max(100, "סיסמה לא יכולה להיות יותר מ-100 תווים");

// Display name validation
export const displayNameSchema = z
  .string({ message: "שם תצוגה נדרש" })
  .min(2, "שם תצוגה חייב להיות לפחות 2 תווים")
  .max(100, "שם תצוגה לא יכול להיות יותר מ-100 תווים");

// Email validation (optional)
export const emailSchema = z
  .string()
  .email("כתובת אימייל לא תקינה")
  .optional()
  .or(z.literal(""));

// User registration schema
// API registration schema - supports both student and teacher registration
export const userRegistrationSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    displayName: displayNameSchema,
    grade: gradeSchema.optional(),
    classNumber: classNumberSchema.optional(),
    isTeacher: z.boolean().optional().default(false),
    adminPassword: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.isTeacher || (data.adminPassword && data.adminPassword.length > 0),
    {
      message: "סיסמת מנהל נדרשת למורים",
      path: ["adminPassword"],
    },
  )
  .refine((data) => data.isTeacher || (data.grade && data.classNumber), {
    message: "כיתה נדרשת לתלמידים",
    path: ["grade"],
  });

// User registration schema with confirmation (for forms)
// Note: Forms always submit numbers for classNumber, so we use number directly
// Supports both student registration (requires grade/class) and teacher registration (requires admin password)
export const userRegistrationFormSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    displayName: displayNameSchema,
    grade: gradeSchema.optional(),
    classNumber: z.number().int().min(1).max(4).optional(),
    confirmPassword: z.string().min(1, "אימות סיסמה נדרש"),
    isTeacher: z.boolean(),
    adminPassword: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirmPassword"],
  })
  .refine(
    (data) =>
      !data.isTeacher || (data.adminPassword && data.adminPassword.length > 0),
    {
      message: "סיסמת מנהל נדרשת למורים",
      path: ["adminPassword"],
    },
  )
  .refine((data) => data.isTeacher || (data.grade && data.classNumber), {
    message: "כיתה נדרשת",
    path: ["grade"],
  });

// User login schema
export const userLoginSchema = z.object({
  username: usernameSchema,
  password: z.string({ message: "סיסמה נדרשת" }).min(1, "סיסמה נדרשת"),
});

// User update schema
export const userUpdateSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    email: emailSchema,
    grade: gradeSchema.optional(),
    classNumber: classNumberSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "לפחות שדה אחד נדרש לעדכון",
  });

/**
 * Post validation schemas
 */

// Post status validation
export const postStatusSchema = z.enum(["draft", "published"], {
  message: "סטטוס חייב להיות draft או published",
});

// Post title validation
export const postTitleSchema = z
  .string()
  .min(1, "כותרת נדרשת")
  .max(200, "כותרת לא יכולה להיות יותר מ-200 תווים");

// Post content validation
export const postContentSchema = z
  .string()
  .min(1, "תוכן נדרש")
  .max(50000, "תוכן לא יכול להיות יותר מ-50,000 תווים");

// Post description validation
export const postDescriptionSchema = z
  .string()
  .max(500, "תיאור לא יכול להיות יותר מ-500 תווים")
  .optional();

// Cover image URL validation
export const coverImageSchema = z
  .string()
  .url("כתובת תמונה לא תקינה")
  .optional()
  .or(z.literal(""));

// Tags validation
export const tagsSchema = z
  .array(z.string().min(1).max(50))
  .max(10, "ניתן להוסיף עד 10 תגיות")
  .optional();

// Category validation
export const categorySchema = z
  .string()
  .max(50, "קטגוריה לא יכולה להיות יותר מ-50 תווים")
  .optional()
  .or(z.literal(""));

// Post input schema (for create/update)
export const postInputSchema = z.object({
  title: postTitleSchema,
  content: postContentSchema,
  description: postDescriptionSchema,
  coverImage: coverImageSchema,
  author: z.string().max(100).optional(),
  authorId: z.string().uuid().optional(),
  authorGrade: gradeSchema.optional(),
  authorClass: classNumberSchema.optional(),
  isTeacherPost: z.boolean().optional(),
  tags: tagsSchema,
  category: categorySchema,
  status: postStatusSchema.optional(),
});

// Post update schema (all fields optional except at least one must be present)
export const postUpdateSchema = z
  .object({
    title: postTitleSchema.optional(),
    content: postContentSchema.optional(),
    description: postDescriptionSchema,
    coverImage: coverImageSchema,
    author: z.string().max(100).optional(),
    tags: tagsSchema,
    category: categorySchema,
    status: postStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "לפחות שדה אחד נדרש לעדכון",
  });

/**
 * Admin validation schemas
 */

// Admin password verification
export const adminPasswordSchema = z.object({
  password: z.string().min(1, "סיסמה נדרשת"),
});

/**
 * Environment variable validation schema
 */
export const envSchema = z.object({
  // Required variables
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for security"),
  ADMIN_PASSWORD: z
    .string()
    .min(8, "ADMIN_PASSWORD should be at least 8 characters"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL"),

  // Optional but validated if present
  POSTGRES_URL: z.string().url().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  SESSION_DURATION: z
    .string()
    .regex(
      /^\d+[smhd]$/,
      "SESSION_DURATION must be in format: 1s, 1m, 1h, or 1d",
    )
    .optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

/**
 * API response schemas
 */

export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown().optional(),
  message: z.string().optional(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  errors: z.record(z.string(), z.string()).optional(), // Field-level errors
});

/**
 * Helper function to validate and return formatted errors
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}

/**
 * Type exports for validated data
 */
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserRegistrationFormInput = z.infer<
  typeof userRegistrationFormSchema
>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type PostInput = z.infer<typeof postInputSchema>;
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
export type EnvVariables = z.infer<typeof envSchema>;
