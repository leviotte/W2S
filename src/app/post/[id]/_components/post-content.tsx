//src/app/post/[id]/_components/post-content.tsx
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ArrowLeft, Eye, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BlogPost } from '@/types/blog';
import type { UserProfile } from '@/types/user';
import { toDate } from '@/types/blog';

type Props = {
  post: BlogPost;
  isAdmin: boolean;
  currentUser: (UserProfile & { id: string }) | null;
};

export function PostContent({ post, isAdmin, currentUser }: Props) {
  const router = useRouter();

  const navigateBack = () => {
    if (isAdmin) {
      router.push('/admin-dashboard?tab=blogs');
    } else if (currentUser) {
      router.push('/dashboard?tab=blogs');
    } else {
      router.push('/blog');
    }
  };

  const formattedDate = format(toDate(post.createdAt), 'd MMMM yyyy', { locale: nl });

  return (
    <article className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={navigateBack}
          className="mb-8 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar de blog
        </Button>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {post.headTitle}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={toDate(post.createdAt).toISOString()}>
                {formattedDate}
              </time>
            </div>

            {post.author?.name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author.name}</span>
              </div>
            )}

            {post.views !== undefined && (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{post.views} views</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="mt-6 text-xl text-gray-700 leading-relaxed">
            {post.headDescription}
          </p>
        </header>

        {/* Featured Image */}
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-8">
          <Image
            src={post.headImage}
            alt={post.headTitle}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </div>

        {/* Sub Description */}
        {post.subDescription && (
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            {post.subDescription}
          </p>
        )}

        {/* Sections */}
        {post.sections && post.sections.length > 0 && (
          <div className="space-y-12">
            {post.sections.map((section, index) => (
              <section key={index} className="border-t border-gray-100 pt-8">
                {/* Section Title */}
                {section.subTitle && (
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    {section.subTitle}
                  </h2>
                )}

                {/* Section Content (Rich Text) */}
                {section.content && (
                  <div
                    className="prose prose-lg max-w-none mb-8
                      prose-headings:text-gray-900
                      prose-p:text-gray-700
                      prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-gray-900
                      prose-ul:text-gray-700
                      prose-ol:text-gray-700
                      prose-img:rounded-lg
                    "
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}

                {/* Section Items (Products) */}
                {section.items && section.items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                      >
                        {/* Product Image */}
                        {item.image && (
                          <div className="relative w-full h-48">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          </div>
                        )}

                        {/* Product Info */}
                        <div className="p-4 flex-grow flex flex-col">
                          <h3 className="font-bold text-lg mb-2 line-clamp-2">
                            {item.title}
                          </h3>
                          {item.price && (
                            <p className="text-accent font-semibold text-xl mb-2">
                              {item.price}
                            </p>
                          )}
                          <div className="mt-auto pt-4">
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline font-medium"
                              >
                                Bekijk product →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Admin Actions */}
{isAdmin && (
  <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4">
    <Button
      onClick={() => router.push(`/dashboard/posts/${post.id}/edit`)}  // ✅ GEFIXED
      variant="outline"
    >
      Post bewerken
    </Button>
  </div>
)}
      </div>
    </article>
  );
}