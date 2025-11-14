/**
 * Authentication and Security Constants
 */

/**
 * Number of salt rounds for bcrypt password hashing
 * Higher numbers = more secure but slower
 * 12 rounds provides good security/performance balance
 */
export const BCRYPT_SALT_ROUNDS = 12;

/**
 * JWT token expiration time in seconds
 * Default: 7 days (604800 seconds)
 * Can be overridden with SESSION_DURATION environment variable
 */
export const DEFAULT_SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Minimum required length for JWT secret
 * Ensures cryptographic security of signed tokens
 */
export const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Cookie names used for authentication
 */
export const AUTH_COOKIE_NAME = 'authToken';
export const ADMIN_COOKIE_NAME = 'adminAuth';

/**
 * Minimum recommended password length
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Minimum recommended admin password length
 */
export const MIN_ADMIN_PASSWORD_LENGTH = 8;
