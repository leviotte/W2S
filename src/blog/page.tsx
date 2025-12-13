// src/app/blog/page.tsx
import { adminDb } from "@/lib/server/firebase-admin";
import { getSession } from "@/lib/auth/actions";
import PageTitle from "@/components/layout/page-title";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { PostCard } from "@/components/blog/post-card";

// BELANGRIJK: Hier definiëren en exporteren we het juiste type!
export interface PostSummary {
  id: string;
  headTitle: string;
  headDescription: string;
  headImage: string;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

async function getPosts(): Promise<PostSummary[]> {
  const snapshot = await adminDb.collection("posts").orderBy("createdAt", "desc").get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PostSummary[];
}

export default async function BlogPage() {
  const session = await getSession();
  const isAdmin = session?.user?.isAdmin || false;
  const posts = await getPosts();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <PageTitle title="Ons Blog" />
        {isAdmin && (
          <Button asChild>
            <Link href="/blog/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nieuwe Post
            </Link>
          </Button>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} isAdmin={isAdmin} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-700">Nog geen posts...</h2>
          <p className="mt-2 text-gray-500">Kom snel terug voor updates!</p>
        </div>
      )}
    </div>
  );
}