/**
 * How wide each month name is in Frank Ruhl Libre 900, in ems, measured in a
 * browser. The issue page uses this to set the name to fill the column exactly:
 * the names run from 1.28em to 3.28em, too wide a spread to estimate per letter.
 * Remeasure if the font changes.
 */
const MONTH_WIDTHS: Record<string, number> = {
  ינואר: 2.05,
  פברואר: 2.87,
  מרץ: 1.54,
  אפריל: 2.38,
  מאי: 1.43,
  יוני: 1.29,
  יולי: 1.45,
  אוגוסט: 2.67,
  ספטמבר: 3.08,
  אוקטובר: 3.28,
  נובמבר: 2.72,
  דצמבר: 2.52,
};

const DASH_WIDTH = 0.47;

// The widest letters measured, so an unknown label can't overflow the column.
const FALLBACK_WIDTH_PER_LETTER = 0.52;

/** The label's width in ems. A merged issue's label is "מאי–יוני". */
export function getLabelWidth(label: string): number {
  const parts = label.split("–");
  const widths = parts.map((part) => MONTH_WIDTHS[part]);

  if (widths.some((width) => width === undefined)) {
    return label.length * FALLBACK_WIDTH_PER_LETTER;
  }

  return (
    widths.reduce((total, width) => total + width, 0) +
    (parts.length - 1) * DASH_WIDTH
  );
}
