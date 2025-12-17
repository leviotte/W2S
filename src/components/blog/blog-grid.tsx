"use client";

import type { BlogPost } from "@/types/blog";
import BlogPostCard from "./blog-post-card";

export default function BlogGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map(post => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
