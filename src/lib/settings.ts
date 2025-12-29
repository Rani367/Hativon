/**
 * Site-wide settings management
 *
 * Provides functions to get and set settings stored in the database.
 * Includes specialized functions for default month management.
 * Auto-creates the settings table on first access if it doesn't exist.
 */

import { db, isDatabaseAvailable } from "./db/client";
import { getCurrentMonthYear, monthNumberToEnglish } from "./date/months";

let settingsTableInitialized = false;

/**
 * Ensure the settings table exists, creating it if necessary
 * This runs automatically on first settings access
 */
async function ensureSettingsTable(): Promise<boolean> {
  if (settingsTableInitialized) {
    return true;
  }

  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return false;
    }

    // Create table if not exists
    await db.query`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Try to create trigger (may already exist from update_updated_at_column function)
    try {
      await db.query`
        CREATE OR REPLACE TRIGGER update_settings_updated_at
          BEFORE UPDATE ON settings
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `;
    } catch {
      // Trigger creation may fail if function doesn't exist, that's ok
    }

    // Insert default values if table is empty
    const { year, month } = getCurrentMonthYear();
    await db.query`
      INSERT INTO settings (key, value) VALUES ('default_month', ${month})
      ON CONFLICT (key) DO NOTHING
    `;
    await db.query`
      INSERT INTO settings (key, value) VALUES ('default_year', ${year.toString()})
      ON CONFLICT (key) DO NOTHING
    `;

    settingsTableInitialized = true;
    console.log("[SETTINGS] Settings table initialized");
    return true;
  } catch (error) {
    console.error("[SETTINGS] Failed to initialize settings table:", error);
    return false;
  }
}

/**
 * Get a setting value by key
 * @param key - The setting key
 * @returns The setting value or null if not found
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const initialized = await ensureSettingsTable();
    if (!initialized) {
      return null;
    }

    const result = await db.query`
      SELECT value FROM settings WHERE key = ${key}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].value;
  } catch (error) {
    console.error(`[SETTINGS] Failed to get setting "${key}":`, error);
    return null;
  }
}

/**
 * Set a setting value
 * @param key - The setting key
 * @param value - The value to set
 */
export async function setSetting(key: string, value: string): Promise<void> {
  try {
    const initialized = await ensureSettingsTable();
    if (!initialized) {
      throw new Error("Database not available");
    }

    await db.query`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP
    `;
  } catch (error) {
    console.error(`[SETTINGS] Failed to set setting "${key}":`, error);
    throw error;
  }
}

/**
 * Get all settings
 * @returns Object with all settings as key-value pairs
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const initialized = await ensureSettingsTable();
    if (!initialized) {
      return {};
    }

    const result = await db.query`SELECT key, value FROM settings`;

    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    return settings;
  } catch (error) {
    console.error("[SETTINGS] Failed to get all settings:", error);
    return {};
  }
}

/**
 * Get the configured default month for the homepage
 * @returns Object with year and month (English name), or null if not configured
 */
export async function getDefaultMonth(): Promise<{
  year: number;
  month: string;
} | null> {
  try {
    const initialized = await ensureSettingsTable();
    if (!initialized) {
      return null;
    }

    const monthResult = await db.query`
      SELECT value FROM settings WHERE key = 'default_month'
    `;
    const yearResult = await db.query`
      SELECT value FROM settings WHERE key = 'default_year'
    `;

    if (monthResult.rows.length === 0 || yearResult.rows.length === 0) {
      return null;
    }

    const month = monthResult.rows[0].value;
    const year = parseInt(yearResult.rows[0].value, 10);

    if (isNaN(year)) {
      return null;
    }

    return { year, month };
  } catch (error) {
    console.error("[SETTINGS] Failed to get default month:", error);
    return null;
  }
}

/**
 * Set the default month for the homepage
 * @param year - The year to set
 * @param month - The month name (English, lowercase)
 */
export async function setDefaultMonth(
  year: number,
  month: string,
): Promise<void> {
  try {
    const initialized = await ensureSettingsTable();
    if (!initialized) {
      throw new Error("Database not available");
    }

    await setSetting("default_month", month.toLowerCase());
    await setSetting("default_year", year.toString());
  } catch (error) {
    console.error("[SETTINGS] Failed to set default month:", error);
    throw error;
  }
}

/**
 * Check if there is a pending month that can be approved
 * A pending month is the current calendar month if:
 * 1. It's different from the current default
 * 2. It has at least one published post
 *
 * @param postCountByMonth - Function to get post count for a month
 * @returns The pending month info or null if none
 */
export async function getPendingMonth(
  getPostCount: (year: number, month: number) => Promise<number>,
): Promise<{
  year: number;
  month: string;
  monthNumber: number;
  postCount: number;
} | null> {
  try {
    const currentDefault = await getDefaultMonth();
    const { year: currentYear, month: currentMonth } = getCurrentMonthYear();

    // Convert current month name to number for comparison
    const MONTH_TO_NUMBER: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    const currentMonthNumber = MONTH_TO_NUMBER[currentMonth.toLowerCase()];

    // If no default set, there's no "pending" concept
    if (!currentDefault) {
      return null;
    }

    const defaultMonthNumber =
      MONTH_TO_NUMBER[currentDefault.month.toLowerCase()];

    // Check if current calendar month is different from default
    if (
      currentDefault.year === currentYear &&
      defaultMonthNumber === currentMonthNumber
    ) {
      return null;
    }

    // Check if current calendar month has posts
    const postCount = await getPostCount(currentYear, currentMonthNumber);

    if (postCount === 0) {
      return null;
    }

    return {
      year: currentYear,
      month: currentMonth,
      monthNumber: currentMonthNumber,
      postCount,
    };
  } catch (error) {
    console.error("[SETTINGS] Failed to check pending month:", error);
    return null;
  }
}

/**
 * Get the default month for the homepage, with fallback to current month
 * This is the main function used by the homepage to determine which month to show
 *
 * @returns Object with year and month (English name)
 */
export async function getDefaultMonthWithFallback(): Promise<{
  year: number;
  month: string;
}> {
  const defaultMonth = await getDefaultMonth();

  if (defaultMonth) {
    return defaultMonth;
  }

  // Fallback to current month if no setting exists or database unavailable
  return getCurrentMonthYear();
}

export interface ArchiveMonthWithDefault {
  year: number;
  month: number;
  monthName: string;
  hebrewMonth: string;
  postCount: number;
  isDefault: boolean;
}

/**
 * Get all months with posts, marking which one is the current default
 * @param getArchiveMonths - Function to get archive months with post counts
 * @returns Array of archive months with default indicator
 */
export async function getArchiveMonthsWithDefault(
  getArchiveMonths: () => Promise<
    Array<{ year: number; month: number; count: number }>
  >,
): Promise<ArchiveMonthWithDefault[]> {
  const MONTH_NAMES_HE: Record<number, string> = {
    1: "ינואר",
    2: "פברואר",
    3: "מרץ",
    4: "אפריל",
    5: "מאי",
    6: "יוני",
    7: "יולי",
    8: "אוגוסט",
    9: "ספטמבר",
    10: "אוקטובר",
    11: "נובמבר",
    12: "דצמבר",
  };

  try {
    const [archives, defaultMonth] = await Promise.all([
      getArchiveMonths(),
      getDefaultMonth(),
    ]);

    return archives.map((archive) => {
      const monthName = monthNumberToEnglish(archive.month) || "january";
      const isDefault = defaultMonth
        ? defaultMonth.year === archive.year &&
          defaultMonth.month.toLowerCase() === monthName.toLowerCase()
        : false;

      return {
        year: archive.year,
        month: archive.month,
        monthName,
        hebrewMonth: MONTH_NAMES_HE[archive.month] || "",
        postCount: archive.count,
        isDefault,
      };
    });
  } catch (error) {
    console.error("[SETTINGS] Failed to get archive months with default:", error);
    return [];
  }
}
