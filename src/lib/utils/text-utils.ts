/**
 * Calculate word count from markdown content
 */
export function getWordCount(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/[#*_~\[\]()]/g, '') // Remove markdown syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return text.split(/\s+/).filter(word => word.length > 0).length;
}
