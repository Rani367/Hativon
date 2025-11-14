'use client';

import { ReactNode } from "react";
import { AuthProvider } from "@/components/features/auth/auth-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
