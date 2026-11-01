import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/studio/action-form";
import { studioCopy } from "@/lib/studio-copy";
import { requestPasswordReset } from "../actions";

const { auth: text } = studioCopy;

export const metadata: Metadata = { title: text.forgotTitle };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="auth-title">{text.forgotTitle}</h1>
      <ActionForm action={requestPasswordReset} submitLabel={text.request}>
        <label className="field">
          <span>{text.username}</span>
          <input name="username" autoComplete="username" dir="ltr" required />
        </label>
      </ActionForm>
      <p className="auth-links">
        <Link href="/login">{text.toLogin}</Link>
      </p>
    </>
  );
}
