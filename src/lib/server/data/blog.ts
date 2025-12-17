// src/lib/server/data/blog.ts

import { cache } from 'react';
import type { BlogPost } from '@/types/blog';

// ---------------------------------------------------------------------------
// Vervang dit later door Firestore / DB
// ---------------------------------------------------------------------------
async function fetchBlogPosts(): Promise<BlogPost[]> {
  return [];
}

// ---------------------------------------------------------------------------
// CACHED LIST
// ---------------------------------------------------------------------------
export const getCachedBlogPosts = cache(async () => {
  return fetchBlogPosts();
});

// ---------------------------------------------------------------------------
// SINGLE POST (ID)
// ---------------------------------------------------------------------------
export const getCachedBlogPost = cache(async (id: string) => {
  const posts = await getCachedBlogPosts();
  return posts.find((p) => p.id === id) ?? null;
});

// ---------------------------------------------------------------------------
// SINGLE POST (SLUG) — ROUTING SOURCE OF TRUTH
// ---------------------------------------------------------------------------
export const getCachedBlogPostBySlug = cache(async (slug: string) => {
  const posts = await getCachedBlogPosts();
  return posts.find((p) => p.slug === slug) ?? null;
});

// ---------------------------------------------------------------------------
// STATIC PARAMS (Next.js)
// ---------------------------------------------------------------------------
export async function getBlogPostIds(): Promise<string[]> {
  const posts = await getCachedBlogPosts();
  return posts.map((p) => p.slug);
}
