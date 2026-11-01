import type { ReactNode } from "react";
import { copy } from "@/lib/copy";
import { SITE_NAME } from "@/lib/site";

const SCHEDULE_URL =
  process.env.NEXT_PUBLIC_MAARECHET_URL ?? "https://maarechet.vercel.app";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="masthead">
        <a className="masthead-name" href="/">
          {SITE_NAME}
        </a>
        <nav className="masthead-nav" aria-label={SITE_NAME}>
          <a href="/issues">{copy.nav.issues}</a>
          <a href="/dashboard">{copy.nav.write}</a>
        </nav>
      </header>

      {children}

      <footer className="colophon">
        <a href={SCHEDULE_URL}>{copy.nav.schedule}</a>
        <span>{copy.site.credit}</span>
      </footer>
    </>
  );
}
