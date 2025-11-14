/**
 * Application Constants
 *
 * Centralized location for all magic numbers, configuration values,
 * and constant strings used throughout the application.
 */

// Re-export all auth constants
export * from './auth';

/**
 * Pagination constants
 */
export const DEFAULT_POSTS_PER_PAGE = 12;
export const ADMIN_POSTS_PER_PAGE = 20;

/**
 * Content limits
 */
export const MAX_POST_TITLE_LENGTH = 200;
export const MAX_POST_DESCRIPTION_LENGTH = 160;
export const MAX_TAG_LENGTH = 50;
export const MAX_TAGS_PER_POST = 10;

/**
 * User field limits
 */
export const MAX_USERNAME_LENGTH = 50;
export const MAX_DISPLAY_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 255;

/**
 * Grade values (Hebrew characters for grades 7-10)
 */
export const VALID_GRADES = ['ז', 'ח', 'ט', 'י'] as const;
export type Grade = typeof VALID_GRADES[number];

/**
 * Class numbers (1-4)
 */
export const MIN_CLASS_NUMBER = 1;
export const MAX_CLASS_NUMBER = 4;

/**
 * File upload limits
 */
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * API response messages (Hebrew)
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'נדרשת הרשאה',
  FORBIDDEN: 'אין לך הרשאה לבצע פעולה זו',
  NOT_FOUND: 'הפריט המבוקש לא נמצא',
  VALIDATION_ERROR: 'הנתונים שהוזנו אינם תקינים',
  SERVER_ERROR: 'אירעה שגיאה בשרת',
  USERNAME_TAKEN: 'שם המשתמש כבר קיים במערכת',
  EMAIL_TAKEN: 'כתובת האימייל כבר קיימת במערכת',
  INVALID_CREDENTIALS: 'שם משתמש או סיסמה שגויים',
  USER_NOT_FOUND: 'משתמש לא נמצא',
} as const;

/**
 * Success messages (Hebrew)
 */
export const SUCCESS_MESSAGES = {
  POST_CREATED: 'הפוסט נוצר בהצלחה',
  POST_UPDATED: 'הפוסט עודכן בהצלחה',
  POST_DELETED: 'הפוסט נמחק בהצלחה',
  USER_CREATED: 'המשתמש נוצר בהצלחה',
  USER_UPDATED: 'המשתמש עודכן בהצלחה',
  USER_DELETED: 'המשתמש נמחק בהצלחה',
  LOGIN_SUCCESS: 'התחברת בהצלחה',
  LOGOUT_SUCCESS: 'התנתקת בהצלחה',
} as const;
