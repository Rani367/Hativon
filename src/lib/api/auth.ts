/**
 * Authentication API helpers
 */

import { apiPost } from './client';
import type { User, UserLogin, UserRegistration } from '@/types/user.types';

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

/**
 * Login user
 */
export async function login(credentials: UserLogin): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/auth/login', credentials);
}

/**
 * Register new user
 */
export async function register(data: UserRegistration): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>('/api/auth/register', data);
}

/**
 * Logout user
 */
export async function logout(): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>('/api/auth/logout');
}

/**
 * Get current session
 */
export async function getSession(): Promise<SessionResponse> {
  return apiPost<SessionResponse>('/api/auth/session');
}

/**
 * Check authentication status
 */
export async function checkAuth(): Promise<SessionResponse> {
  return apiPost<SessionResponse>('/api/check-auth');
}
