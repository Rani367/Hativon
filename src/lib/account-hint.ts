/**
 * Public pages are prebuilt and the session cookie is hidden from scripts, so
 * they can't tell who is reading. The dashboard leaves this note in the browser
 * so the menu can show the right links without a request to the server.
 *
 * It only decides which links to show. Each page behind them still checks the
 * session for itself, so a stale or edited note grants nothing.
 */
const KEY = "hativon_account";

export type AccountHint = "writer" | "teacher";

export function readAccountHint(): AccountHint | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "writer" || value === "teacher" ? value : null;
  } catch {
    return null;
  }
}

export function writeAccountHint(hint: AccountHint | null): void {
  try {
    if (hint) localStorage.setItem(KEY, hint);
    else localStorage.removeItem(KEY);
  } catch {
    // Without storage the menu just offers the login link.
  }
}
