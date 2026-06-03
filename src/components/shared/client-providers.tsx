"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/features/auth/auth-provider";
import { AiImageSurvey } from "@/components/features/posts/ai-image-survey";
import { THEME_STORAGE_KEY } from "@/lib/theme/preferences";
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
        <AiImageSurvey />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
