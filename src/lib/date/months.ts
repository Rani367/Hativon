/**
 * Month name utilities for archive system
 * Maps between English month names (for URLs) and Hebrew month names (for display)
 */

/**
 * Mapping of month numbers (1-12) to English month names (lowercase)
 */
export const MONTH_NAMES_EN: Record<number, string> = {
  1: 'january',
  2: 'february',
  3: 'march',
  4: 'april',
  5: 'may',
  6: 'june',
  7: 'july',
  8: 'august',
  9: 'september',
  10: 'october',
  11: 'november',
  12: 'december',
};

/**
 * Mapping of month numbers (1-12) to Hebrew month names
 */
export const MONTH_NAMES_HE: Record<number, string> = {
  1: 'ינואר',
  2: 'פברואר',
  3: 'מרץ',
  4: 'אפריל',
  5: 'מאי',
  6: 'יוני',
  7: 'יולי',
  8: 'אוגוסט',
  9: 'סספטמבר',
  10: 'אוקטובר',
  11: 'נובמבר',
  12: 'דצמבר',
};

/**
 * Reverse mapping: English month name to month number
 */
export const MONTH_NAME_TO_NUMBER: Record<string, number> = {
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

/**
 * Convert month number to English month name
 * @param month - Month number (1-12)
 * @returns English month name (lowercase) or null if invalid
 */
export function monthNumberToEnglish(month: number): string | null {
  return MONTH_NAMES_EN[month] || null;
}

/**
 * Convert month number to Hebrew month name
 * @param month - Month number (1-12)
 * @returns Hebrew month name or null if invalid
 */
export function monthNumberToHebrew(month: number): string | null {
  return MONTH_NAMES_HE[month] || null;
}

/**
 * Convert English month name to month number
 * @param monthName - English month name (case-insensitive)
 * @returns Month number (1-12) or null if invalid
 */
export function englishMonthToNumber(monthName: string): number | null {
  return MONTH_NAME_TO_NUMBER[monthName.toLowerCase()] || null;
}

/**
 * Convert English month name to Hebrew month name
 * @param monthName - English month name (case-insensitive)
 * @returns Hebrew month name or null if invalid
 */
export function englishToHebrewMonth(monthName: string): string | null {
  const monthNumber = englishMonthToNumber(monthName);
  if (!monthNumber) return null;
  return monthNumberToHebrew(monthNumber);
}

/**
 * Get the current month and year
 * @returns Object with current year and month (as English name)
 */
export function getCurrentMonthYear(): { year: number; month: string } {
  const now = new Date();
  const year = now.getFullYear();
  const monthNumber = now.getMonth() + 1; // getMonth() returns 0-11
  const month = monthNumberToEnglish(monthNumber) || 'january';
  return { year, month };
}

/**
 * Validate if a year/month combination is valid
 * @param year - Year number
 * @param monthName - English month name
 * @returns true if valid, false otherwise
 */
export function isValidYearMonth(year: number, monthName: string): boolean {
  if (year < 1900 || year > 2100) return false;
  return englishMonthToNumber(monthName) !== null;
}
