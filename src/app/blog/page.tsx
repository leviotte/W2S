// src/app/blog/page.tsx
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type PostCardProps = {
  post: BlogPost;
  isAdmin?: boolean;
};

export function PostCard({ post, isAdmin }: PostCardProps) {
  // Flexibele datum formatting
  let datum = '';
  if (post.createdAt instanceof Date) {
    datum = post.createdAt.toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' });
  } else if (typeof post.createdAt === 'string') {
    const d = new Date(post.createdAt);
    datum = isNaN(d.getTime())
      ? post.createdAt
      : d.toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <Card className="group h-full flex flex-col">
      <Link href={`/blog/${post.slug}`} prefetch={false} className="block">
        <CardHeader className="p-0 pb-2 flex flex-col">
          {post.headImage && (
            <img
              src={post.headImage}
              alt={post.headTitle}
              className="w-full h-48 object-cover rounded-t shadow-sm transition group-hover:scale-105"
              loading="lazy"
            />
          )}
          <CardTitle className="mt-4 text-xl font-bold text-cool-olive group-hover:text-warm-olive transition">{post.headTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 px-4">
          <p className="text-gray-700 mt-2 line-clamp-3">{post.headDescription}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500">{datum}</span>
            {isAdmin && (
              <Button asChild variant="ghost" size="icon" className="hover:text-warm-olive">
                <Link href={`/dashboard/posts/${post.id}/edit`} aria-label="Bewerk post">
                  ✎
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}