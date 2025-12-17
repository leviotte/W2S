// src/types/blog.ts

export type BlogSectionItem = {
  id: string;
  title: string;
  description?: string;
  price?: string;
  image?: string;
  url?: string;
};

export type BlogSection = {
  subTitle?: string;
  content?: string; // sanitized HTML
  items?: BlogSectionItem[];
};

export type BlogAuthor = {
  name: string;
};

export type BlogPost = {
  id: string;
  slug: string; // ✅ VERPLICHT — routing, cards, SEO

  headTitle: string;
  headDescription: string;
  subDescription?: string;
  headImage: string;

  sections?: BlogSection[];

  author?: BlogAuthor;
  views?: number;

  createdAt: Date | string;
  updatedAt?: Date | string;
};

export type BlogPostSummary = Pick<
  BlogPost,
  'id' | 'slug' | 'headTitle' | 'headDescription' | 'headImage' | 'createdAt'
>;
