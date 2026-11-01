// Hebrew reading speed for a school-age audience.
const WORDS_PER_MINUTE = 130;

export function getReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
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
