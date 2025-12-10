"use client";

import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash, Edit } from "lucide-react";
import { format } from 'date-fns'; // VERBETERING: Consistente datum-formattering
import { nlBE } from 'date-fns/locale';

// VERBETERING: Verplaats de Post type naar een centrale locatie zoals @/types/blog.ts
// Voor nu importeren we hem nog van de pagina.
import type { PostSummary } from "@/app/blog/page"; // Hernoemd voor duidelijkheid
import { deletePostAction } from "@/lib/actions/blog-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: PostSummary; // Gebruik de duidelijkere naam
  isAdmin: boolean;
}

export function PostCard({ post, isAdmin }: PostCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePostAction(post.id);
      if (result.success) {
        toast.success("Post succesvol verwijderd!");
        // De revalidatie in de server action doet de rest. Perfect!
      } else {
        toast.error(result.error || "Verwijderen mislukt.");
      }
    });
  };

  // VERBETERING: Robuuste datum-formattering die niet crasht als de data anders is.
  const postDate = post.createdAt?._seconds
    ? format(new Date(post.createdAt._seconds * 1000), 'd MMMM yyyy', { locale: nlBE })
    : "Onbekende datum";

  return (
    // VERBETERING: Gebruik de Shadcn Card componenten voor visuele consistentie.
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="p-0">
        <Link href={`/blog/${post.id}`} className="block">
            <div className="relative aspect-video w-full">
                <Image 
                    src={post.headImage} 
                    alt={post.headTitle} 
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
            </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <Link href={`/blog/${post.id}`} className="flex-grow">
          <CardTitle className="text-xl font-bold leading-snug text-gray-800 line-clamp-2">
            {post.headTitle}
          </CardTitle>
          <p className="mt-2 text-base text-gray-600 line-clamp-3">{post.headDescription}</p>
        </Link>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 pt-0">
         <p className="text-sm text-gray-500">{postDate}</p>
         <div className="mt-4 flex w-full items-center justify-between">
            <Link href={`/blog/${post.id}`} className="font-semibold text-blue-600 hover:text-blue-500">
              Lees meer
            </Link>
            {isAdmin && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/posts/${post.id}/edit`)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deze actie kan niet ongedaan worden gemaakt. Dit verwijdert de post permanent.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                        {isPending ? "Verwijderen..." : "Verwijderen"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
         </div>
      </CardFooter>
    </Card>
  );
}