// src/components/blog/PostCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash, Edit } from "lucide-react";

// Importeer de type definitie van de server component
import type { Post } from "@/app/blog/page";
// Importeer onze nieuwe server action
import { deletePostAction } from "@/lib/actions/blog-actions";

import { Button } from "@/components/ui/button";
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
  post: Post;
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
        // De `revalidatePath` in de action zorgt voor de UI update
      } else {
        toast.error(result.error || "Verwijderen mislukt.");
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      <Link href={`/blog/${post.id}`} className="block">
        <Image src={post.headImage} alt={post.headTitle} width={400} height={250} className="w-full h-48 object-cover" />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/blog/${post.id}`} className="flex-grow">
          <h2 className="text-xl font-semibold text-slate-700 line-clamp-2">{post.headTitle}</h2>
          <p className="mt-2 text-slate-600 line-clamp-3">{post.headDescription}</p>
        </Link>
        <div className="mt-4">
          <p className="text-gray-500 text-sm">
            {new Date(post.createdAt).toLocaleDateString("nl-BE", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
          <div className="flex justify-between items-center mt-4">
            <Link href={`/blog/${post.id}`} className="text-warm-olive hover:underline font-bold">
              Lees meer →
            </Link>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/blog/${post.id}/edit`)}>
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
        </div>
      </div>
    </div>
  );
}