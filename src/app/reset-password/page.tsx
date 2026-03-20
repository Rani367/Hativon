import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "איפוס סיסמה",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-lg border bg-card p-6">
            <div className="space-y-4">
              <div className="h-7 w-32 rounded bg-muted animate-pulse mx-auto" />
              <div className="h-4 w-48 rounded bg-muted animate-pulse mx-auto" />
              <div className="h-10 rounded bg-muted animate-pulse" />
              <div className="h-10 rounded bg-muted animate-pulse" />
            </div>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
