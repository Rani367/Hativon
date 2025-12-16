"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from "react";
import { User, UserLogin, UserRegistration } from "@/types/user.types";
import { logError } from "@/lib/logger";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    credentials: UserLogin,
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    data: UserRegistration,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Check authentication status - deferred to not block initial render
  const checkAuth = useCallback(async () => {
    try {
      // Use low priority fetch to not block main thread
      const response = await fetch("/api/auth/session", {
        priority: "low",
      } as RequestInit);
      const data = await response.json();

      // Use transition to mark this as non-urgent update
      startTransition(() => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } catch (error) {
      logError("Auth check failed:", error);
      startTransition(() => {
        setUser(null);
        setLoading(false);
      });
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: UserLogin) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || "התחברות נכשלה" };
      }
    } catch (error) {
      logError("Login failed:", error);
      return { success: false, message: "שגיאה בהתחברות" };
    }
  }, []);

  // Register function
  const register = useCallback(async (data: UserRegistration) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, message: result.message || "הרשמה נכשלה" };
      }
    } catch (error) {
      logError("Registration failed:", error);
      return { success: false, message: "שגיאה בהרשמה" };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setUser(null);
      }
    } catch (error) {
      logError("Logout failed:", error);
    }
  }, []);

  // Check auth on mount - use requestIdleCallback to defer until browser is idle
  useEffect(() => {
    // Defer auth check to not block initial paint
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(
        () => {
          checkAuth();
        },
        { timeout: 2000 },
      ); // Max 2 second delay
      return () => window.cancelIdleCallback(idleId);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(checkAuth, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
