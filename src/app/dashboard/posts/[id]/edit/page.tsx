import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getPostAction } from '@/lib/server/actions/blog';
import { getSession } from '@/lib/auth/session';
import { UpdatePostForm } from './_components/update-post-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    redirect('/');
  }

  const result = await getPostAction(id);

  if (!result.success || !result.post) {
    notFound();
  }

  const post = result.post;

  // Check if user is author or admin
  const isAuthor = post.authorId === session.user.id;
  const isAdmin = session.user.isAdmin === true;

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