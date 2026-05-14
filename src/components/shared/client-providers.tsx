"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/features/auth/auth-provider";
import { DARK_MODE_ANNOUNCEMENT_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/theme/preferences";
import { DarkModeAnnouncement } from "./dark-mode-announcement";
import { NavigationCacheRegistrar } from "./navigation-cache-registrar";
import { ThemeProvider } from "./theme-provider";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      enableSystem={false}
      storageKey={THEME_STORAGE_KEY}
    >
      <AuthProvider>
        <NavigationCacheRegistrar />
        {children}
        <DarkModeAnnouncement
          dismissalStorageKey={DARK_MODE_ANNOUNCEMENT_STORAGE_KEY}
          themeStorageKey={THEME_STORAGE_KEY}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
