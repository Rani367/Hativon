import { db } from "@/lib/db";

/** Kept here rather than in git because the repository is public. */
export const SIGNUP_CODE_KEY = "signup_code";

export async function getSetting(key: string): Promise<string | null> {
  const rows = await db()`SELECT value FROM settings WHERE key = ${key}`;
  return (rows[0]?.value as string | undefined) ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db()`
    INSERT INTO settings (key, value)
    VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}
