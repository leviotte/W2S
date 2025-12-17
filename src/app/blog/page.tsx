import { getCachedBlogPosts } from "@/lib/server/data/blog";
import BlogGrid from "@/components/blog/blog-grid";

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getCachedBlogPosts();
  return <BlogGrid posts={posts} />;
}
