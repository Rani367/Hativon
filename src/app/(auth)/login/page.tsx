import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/studio/action-form";
import { getSessionUser } from "@/lib/auth/session";
import { studioCopy } from "@/lib/studio-copy";
import { login } from "../actions";

const { auth: text } = studioCopy;

export const metadata: Metadata = { title: text.loginTitle };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <>
      <h1 className="auth-title">{text.loginTitle}</h1>
      <ActionForm action={login} submitLabel={text.login}>
        <label className="field">
          <span>{text.username}</span>
          <input name="username" autoComplete="username" dir="ltr" required />
        </label>
        <label className="field">
          <span>{text.password}</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            required
          />
        </label>
      </ActionForm>
      <p className="auth-links">
        <Link href="/signup">{text.toSignup}</Link>
        <Link href="/forgot-password">{text.forgot}</Link>
      </p>
    </>
  );
}
