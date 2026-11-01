import { db } from "@/lib/db";

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
