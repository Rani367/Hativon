import Link from "next/link";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AccountNote, LogoutButton } from "@/components/studio/account-note";
import { SITE_NAME } from "@/lib/site";
import { studioCopy } from "@/lib/studio-copy";
import type { User } from "@/lib/users/types";

const { nav: text } = studioCopy;

/** The bar and the toasts around every writer and teacher page. */
export function StudioShell({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return (
    <>
      <header className="studio-bar">
        <a className="masthead-name" href="/">
          {SITE_NAME}
        </a>
        <nav className="studio-nav" aria-label={SITE_NAME}>
          <Link href="/dashboard">{text.myArticles}</Link>
          <Link href="/dashboard/posts/new">{text.newArticle}</Link>
          <Link href="/dashboard/profile">{text.profile}</Link>
          {user.isTeacher ? <Link href="/admin">{text.admin}</Link> : null}
          <LogoutButton />
        </nav>
      </header>
      <AccountNote hint={user.isTeacher ? "teacher" : "writer"} />

      {children}

      <Toaster
        position="bottom-center"
        dir="rtl"
        toastOptions={{
          style: {
            background: "var(--ink)",
            color: "var(--paper)",
            border: "none",
            borderRadius: "999px",
          },
        }}
      />
    </>
  );
}
