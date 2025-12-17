'use client';

// src/app/blog/[id]/_components/post-content.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ArrowLeft, Eye, Calendar, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { BlogPost } from '@/types/blog';
import type { UserProfile } from '@/types/user';
import { toDate } from '@/lib/utils/date';

type Props = {
  post: BlogPost;
  isAdmin: boolean;
  currentUser: (UserProfile & { id: string }) | null;
};

export function PostContent({ post, isAdmin, currentUser }: Props) {
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/blog/${post.id}/view`, { method: 'POST' });
  }, [post.id]);

  const back = () => {
    if (isAdmin) router.push('/dashboard?tab=blogs');
    else router.push('/blog');
  };

  const formattedDate = format(toDate(post.createdAt), 'd MMMM yyyy', { locale: nl });

  return (
    <article className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <Button variant="ghost" onClick={back} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar blog
        </Button>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.headTitle}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time>{formattedDate}</time>
            </div>

            {post.author?.name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author.name}
              </div>
            )}

            {typeof post.views === 'number' && (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {post.views} views
              </div>
            )}
          </div>

          <p className="mt-6 text-xl text-gray-700">{post.headDescription}</p>
        </header>

        <div className="relative aspect-[16/9] mb-8 rounded-lg overflow-hidden">
          <Image
            src={post.headImage}
            alt={post.headTitle}
            fill
            priority
            className="object-cover"
          />
        </div>

        {post.subDescription && (
          <p className="text-xl mb-8 text-gray-700">{post.subDescription}</p>
        )}

        {post.sections?.map((section, i) => (
          <section key={i} className="pt-8 border-t space-y-6">
            {section.subTitle && (
              <h2 className="text-3xl font-bold">{section.subTitle}</h2>
            )}

            {section.content && (
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            )}
          </section>
        ))}

        {isAdmin && (
          <div className="mt-12 pt-8 border-t">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/blog/${post.id}/edit`)}
            >
              Blog bewerken
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
