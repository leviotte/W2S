// src/app/dashboard/posts/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getPostAction } from '@/lib/server/actions/blog';
import { getCurrentUser } from '@/lib/auth/actions'; // ✅ FIXED: Correct import
import { UpdatePostForm } from './_components/update-post-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  
  // ✅ FIXED: Get currentUser
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/?modal=login');
  }

  const result = await getPostAction(id);

  if (!result.success || !result.post) {
    notFound();
  }

  const post = result.post;

  // ✅ FIXED: Check authorId from post
  const isAuthor = (post as any).authorId === currentUser.id;
  const isAdmin = currentUser.isAdmin === true;

  if (!isAuthor && !isAdmin) {
    redirect('/blog');
  }

  return (
    <div className="container max-w-6xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Post Bewerken</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<EditPostSkeleton />}>
            <UpdatePostForm post={post} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function EditPostSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}