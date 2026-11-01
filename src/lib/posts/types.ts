export interface PostSummary {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  wordCount: number;
  /** ISO timestamp. Decides which issue the post belongs to. */
  date: string;
  author?: string;
  authorGrade?: string;
  authorClass?: number;
  authorDeleted: boolean;
  isTeacherPost: boolean;
  isCreatorPost: boolean;
  aiGeneratedImage: boolean;
}

export interface Post extends PostSummary {
  /** Markdown. */
  content: string;
  tags: string[];
  category?: string;
  updatedAt: string;
}
