/**
 * User type definitions for authentication and authorization
 */

export type Grade = 'ז' | 'ח' | 'ט' | 'י';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  grade: Grade;
  classNumber: number;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UserRegistration {
  username: string;
  password: string;
  displayName: string;
  grade: Grade;
  classNumber: number;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserUpdate {
  displayName?: string;
  email?: string;
  grade?: Grade;
  classNumber?: number;
}

/**
 * User object without sensitive information
 * Used for API responses and client-side state
 */
export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

/**
 * Session response
 */
export interface SessionResponse {
  authenticated: boolean;
  user?: User;
}
