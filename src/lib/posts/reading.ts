// Hebrew reading speed for a school-age audience.
const WORDS_PER_MINUTE = 130;

export function getReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

function comparableText(text: string): string {
  return text
    .replace(/[#*_~`>\\\[\]()]/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, "");
}

/**
 * True when a description is just the opening of the article, which is what
 * writers get if they leave it empty. Showing it above the article would print
 * the same sentence twice.
 */
export function isOpeningOfArticle(
  description: string,
  content: string,
): boolean {
  const excerpt = comparableText(description.replace(/\.{3}$/, ""));
  return excerpt.length > 0 && comparableText(content).startsWith(excerpt);
}

export function getWordCount(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/[#*_~\[\]()]/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();

  return text ? text.split(/\s+/).length : 0;
}
