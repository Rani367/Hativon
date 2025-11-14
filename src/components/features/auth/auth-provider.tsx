'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserLogin, UserRegistration } from '@/types/user.types';
import { logError } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<{ success: boolean; message?: string }>;
  register: (data: UserRegistration) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      logError('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: UserLogin) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'התחברות נכשלה' };
      }
    } catch (error) {
      logError('Login failed:', error);
      return { success: false, message: 'שגיאה בהתחברות' };
    }
  }, []);

  // Register function
  const register = useCallback(async (data: UserRegistration) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, message: result.message || 'הרשמה נכשלה' };
      }
    } catch (error) {
      logError('Registration failed:', error);
      return { success: false, message: 'שגיאה בהרשמה' };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
    } catch (error) {
      logError('Logout failed:', error);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
