import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { requireTeacher } from "@/lib/auth/guards";
import { studioCopy } from "@/lib/studio-copy";
import "../(public)/public.css";
import "../studio.css";

const { nav } = studioCopy;

export const metadata: Metadata = {
  title: nav.admin,
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const teacher = await requireTeacher();

  return (
    <StudioShell user={teacher}>
      <main id="main" className="studio-page">
        <nav className="studio-nav" aria-label={nav.admin}>
          <Link href="/admin">{nav.articles}</Link>
          <Link href="/admin/users">{nav.users}</Link>
          <Link href="/admin/issues">{nav.issues}</Link>
        </nav>
        <div style={{ marginBlockStart: "2rem" }}>{children}</div>
      </main>
    </StudioShell>
  );
}
