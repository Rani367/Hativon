import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateReadingTime(wordCount: number): string {
  const WORDS_PER_MINUTE = 130; // Hebrew reading speed for school-age audience
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
  return `${minutes} דק׳ קריאה`;
}
