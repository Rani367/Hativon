/** URLs use the English month name, the interface uses the Hebrew one. */
const MONTHS = [
  { en: "january", he: "ינואר" },
  { en: "february", he: "פברואר" },
  { en: "march", he: "מרץ" },
  { en: "april", he: "אפריל" },
  { en: "may", he: "מאי" },
  { en: "june", he: "יוני" },
  { en: "july", he: "יולי" },
  { en: "august", he: "אוגוסט" },
  { en: "september", he: "ספטמבר" },
  { en: "october", he: "אוקטובר" },
  { en: "november", he: "נובמבר" },
  { en: "december", he: "דצמבר" },
] as const;

export function monthNumberToEnglish(month: number): string | null {
  return MONTHS[month - 1]?.en ?? null;
}

export function monthNumberToHebrew(month: number): string | null {
  return MONTHS[month - 1]?.he ?? null;
}

export function englishMonthToNumber(name: string): number | null {
  const lowered = name.toLowerCase();
  const index = MONTHS.findIndex((month) => month.en === lowered);
  return index === -1 ? null : index + 1;
}
