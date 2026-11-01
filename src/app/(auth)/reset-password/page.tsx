import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/studio/action-form";
import { studioCopy } from "@/lib/studio-copy";
import { isResetTokenValid } from "@/lib/users/queries";
import { resetPassword } from "../actions";

const { auth: text } = studioCopy;

export const metadata: Metadata = { title: text.resetTitle };

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const valid = token ? await isResetTokenValid(token) : false;

  return (
    <>
      <h1 className="auth-title">{text.resetTitle}</h1>
      {valid ? (
        <ActionForm action={resetPassword} submitLabel={text.setPassword}>
          <input type="hidden" name="token" value={token} />
          <label className="field">
            <span>{text.password}</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              minLength={8}
              required
            />
          </label>
          <label className="field">
            <span>{text.confirmPassword}</span>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              required
            />
          </label>
        </ActionForm>
      ) : (
        <p className="form-error">{text.badToken}</p>
      )}
      <p className="auth-links">
        <Link href="/login">{text.toLogin}</Link>
      </p>
    </>
  );
}
