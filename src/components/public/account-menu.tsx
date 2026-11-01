"use client";

import { useSyncExternalStore } from "react";
import { logout } from "@/app/(auth)/actions";
import { type AccountHint, readAccountHint, writeAccountHint } from "@/lib/account-hint";
import { copy } from "@/lib/copy";
import { studioCopy } from "@/lib/studio-copy";

const { nav: text } = studioCopy;

const subscribe = () => () => {};

/** The browser's own popover: closing on Escape and outside clicks comes free. */
export function AccountMenu() {
  const account = useSyncExternalStore<AccountHint | null>(
    subscribe,
    readAccountHint,
    () => null,
  );

  if (!account) return <a href="/login">{copy.nav.login}</a>;

  return (
    <>
      <button type="button" className="account-button" popoverTarget="account-menu">
        {copy.nav.account}
      </button>
      <div id="account-menu" className="account-menu" popover="auto">
        <a href="/dashboard">{text.myArticles}</a>
        <a href="/dashboard/posts/new">{text.newArticle}</a>
        <a href="/dashboard/profile">{text.profile}</a>
        {account === "teacher" ? <a href="/admin">{text.admin}</a> : null}
        <form action={logout} onSubmit={() => writeAccountHint(null)}>
          <button type="submit">{text.logout}</button>
        </form>
      </div>
    </>
  );
}
