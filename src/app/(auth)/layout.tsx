import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/site";
import "../studio.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <Link className="auth-name" href="/">
        {SITE_NAME}
      </Link>
      <main id="main" className="auth-panel">
        {children}
      </main>
    </div>
  );
}
