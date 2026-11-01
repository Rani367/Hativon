"use client";

import { useEffect } from "react";
import { logout } from "@/app/(auth)/actions";
import { type AccountHint, writeAccountHint } from "@/lib/account-hint";
import { studioCopy } from "@/lib/studio-copy";

/** Keeps the public site's account menu in step with who is signed in. */
export function AccountNote({ hint }: { hint: AccountHint }) {
  useEffect(() => {
    writeAccountHint(hint);
  }, [hint]);

  return null;
}

export function LogoutButton() {
  return (
    <form action={logout} onSubmit={() => writeAccountHint(null)}>
      <button type="submit" className="text-button">
        {studioCopy.nav.logout}
      </button>
    </form>
  );
}
