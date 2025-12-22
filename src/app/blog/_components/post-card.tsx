// src/components/blog/post-card.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Heart, MessageCircle, Edit, Trash2 } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    headTitle: string;
    headDescription: string;
    headImage: string;
    createdAt: {
      _seconds: number;
      _nanoseconds: number;
    };
    views?: number;
    likes?: string[];
    comments?: any[];
  };
  isAdmin?: boolean;
}

export function PostCard({ post, isAdmin }: PostCardProps) {
  // Convert Firestore timestamp to Date
  const createdAtDate = new Date(post.createdAt._seconds * 1000);

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/blog/${post.id}`}>
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={post.headImage}
            alt={post.headTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      <CardHeader>
        <Link href={`/blog/${post.id}`}>
          <h3 className="text-xl font-semibold line-clamp-2 hover:text-warm-olive transition-colors">
            {post.headTitle}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-3">
          {post.headDescription}
        </p>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.views || 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {post.likes?.length || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.comments?.length || 0}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {format(createdAtDate, 'd MMMM yyyy', { locale: nl })}
        </p>

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/posts/${post.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}