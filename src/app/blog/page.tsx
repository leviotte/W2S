// src/app/blog/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
// Importeer de admin SDK types die we nodig hebben
import { Timestamp, QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

// AANGEPAST PAD: Dit pad moet correct verwijzen naar waar je 'db' exporteert.
import { adminDb } from "@/lib/server/firebase-admin"; 
import { getSession } from "@/lib/server/auth";

// Component imports
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/blog/PostCard";

// Dit is de data-structuur voor een post.
export interface Post {
  id: string;
  headTitle: string;
  headDescription: string;
  headImage: string;
  createdAt: number; 
}

/**
 * Haalt alle blogposts op uit Firestore op de server.
 */
async function getPosts(): Promise<Post[]> {
  const postsSnapshot = await adminDb.collection("posts").get();
  
  if (postsSnapshot.empty) {
    return [];
  }

  // CORRECTIE: Type 'doc' expliciet.
  const posts = postsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data();
    // Geef de 'createdAt' een specifiek type
    const createdAt = data.createdAt as Timestamp;

    return {
      id: doc.id,
      headTitle: data.headTitle || "",
      headDescription: data.headDescription || "",
      headImage: data.headImage || "",
      createdAt: createdAt ? createdAt.toMillis() : 0, 
    };
  });

  // CORRECTIE: Type 'a' en 'b' expliciet.
  posts.sort((a: Post, b: Post) => b.createdAt - a.createdAt);

  return posts;
}


export default async function BlogPage() {
  const [posts, session] = await Promise.all([
    getPosts(),
    getSession()
  ]);

  const isAdmin = session?.user?.isAdmin || false;

  return (
    <section id="section-1" className="container mx-auto py-12 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
        <div className="flex-1">
          <h1 className="text-gray-900 font-bold text-4xl lg:text-5xl">
            Vind Inspiratie op onze <span className="text-warm-olive">Blog</span>
          </h1>
          <p className="text-gray-600 font-medium text-lg max-w-2xl mt-4">
            De bron voor cadeau-ideeën en inspiratie. Van trendy gadgets tot unieke items, hier vind je alles voor het perfecte cadeau en je ideale verlanglijst.
          </p>
        </div>
        {isAdmin && (
          // Gebruik 'asChild' prop voor Link-component in een Button voor correcte semantiek
          <Button asChild className="bg-warm-olive hover:bg-cool-olive text-white flex items-center gap-2 mt-4 sm:mt-0">
            {/* Aangenomen dat de create-pagina hier komt te staan */}
            <Link href="/dashboard/posts/create"> 
              <Plus className="h-5 w-5" />
              Nieuw
            </Link>
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Er zijn nog geen blogberichten. Kom snel terug!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </section>
  );
}

// Om de 10 minuten de data vernieuwen op de server (Incremental Static Regeneration)
export const revalidate = 600;