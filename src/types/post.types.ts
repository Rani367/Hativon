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
  tags?: string[];
  category?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title: string;
  content: string;
  coverImage?: string;
  author?: string;
  authorId?: string; // User ID reference for post ownership
  tags?: string[];
  category?: string;
  status?: 'draft' | 'published';
}

export interface PostStats {
  total: number;
  published: number;
  drafts: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}
