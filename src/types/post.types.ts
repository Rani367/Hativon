export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  description: string;
  date: string;
  author?: string;
  authorId?: string; // User ID reference for post ownership
  authorGrade?: string; // Author's grade (ז, ח, ט, י)
  authorClass?: number; // Author's class number (1-4)
  authorDeleted?: boolean; // True if the author user has been deleted
  tags?: string[];
  category?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title: string;
  content: string;
  description?: string; // Optional custom description - if not provided, auto-generated from content
  coverImage?: string; // Optional cover image for post
  author?: string;
  authorId?: string; // User ID reference for post ownership
  authorGrade?: string; // Author's grade (ז, ח, ט, י)
  authorClass?: number; // Author's class number (1-4)
  tags?: string[];
  category?: string;
  status?: "draft" | "published";
}

export interface PostStats {
  total: number;
  published: number;
  drafts: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}
