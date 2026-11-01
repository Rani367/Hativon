const hebrewDate = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  // Servers run in UTC, so without this a post published late at night in
  // Israel would show the previous day.
  timeZone: "Asia/Jerusalem",
});

/** For example "22 בדצמבר 2025". */
export function formatHebrewDate(date: string | Date): string {
  return hebrewDate.format(new Date(date));
}
