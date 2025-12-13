// src/app/blog/_components/blog-grid.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { BlogPost } from '@/types/blog';
import { deletePostAction } from '@/lib/server/actions/blog';
import { toDate } from '@/types/blog';

type Props = {
  post: BlogPost;
  isAdmin: boolean;
};

export function BlogPostCard({ post, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    startTransition(async () => {
      const result = await deletePostAction(post.id);
      
      if (result.success) {
        toast.success('Post verwijderd');
        router.refresh();
      } else {
        toast.error(result.error);
        setIsDeleting(false);
      }
    });
  };

  const formattedDate = format(toDate(post.createdAt), 'd MMMM yyyy', { locale: nl });

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {/* Image */}
      <Link href={`/post/${post.id}`} className="block relative w-full aspect-[16/9] overflow-hidden">
        <Image
          src={post.headImage}
          alt={post.headTitle}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </Link>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <Link href={`/post/${post.id}`} className="flex-grow">
          <h2 className="text-xl font-semibold text-slate-700 hover:text-accent transition-colors line-clamp-2">
            {post.headTitle}
          </h2>
          <p className="mt-3 text-slate-600 line-clamp-3">
            {post.headDescription}
          </p>
        </Link>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-gray-500 text-sm">
            {formattedDate}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-4">
          <Link
            href={`/post/${post.id}`}
            className="text-accent hover:text-accent/80 font-semibold text-sm transition-colors"
          >
            Lees meer →
          </Link>

          {isAdmin && (
            <div className="flex gap-2">
              {/* Update Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/update-post/${post.id}`)}
                disabled={isPending}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deze actie kan niet ongedaan worden gemaakt. De blog post
                      wordt permanent verwijderd.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Verwijderen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}