import type { ReactNode } from "react";
import { AccountMenu } from "@/components/public/account-menu";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { copy } from "@/lib/copy";
import { SITE_NAME } from "@/lib/site";
import "./public.css";

const SCHEDULE_URL =
  process.env.NEXT_PUBLIC_MAARECHET_URL ?? "https://maarechet.vercel.app";

// Which pages to fetch ahead of a tap. Moderate means on hover or touch-start, so
// the page, and with it the morph, is usually ready before the tap lands.
const SPECULATION_RULES = JSON.stringify({
  prefetch: [
    { where: { href_matches: "/posts/*" }, eagerness: "moderate" },
  ],
});

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        {copy.nav.skipToContent}
      </a>

      <header className="masthead">
        <div className="masthead-bar">
          <a className="masthead-name" href="/">
            {SITE_NAME}
          </a>
          <nav className="masthead-nav" aria-label={copy.nav.main}>
            <a href="/issues">{copy.nav.issues}</a>
            <a href="/search">{copy.nav.search}</a>
            <AccountMenu />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {children}

      <footer className="colophon">
        <a href={SCHEDULE_URL}>{copy.nav.schedule}</a>
        <span>{copy.site.credit}</span>
      </footer>

      <script
        type="speculationrules"
        dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }}
      />
    </>
  );
}
