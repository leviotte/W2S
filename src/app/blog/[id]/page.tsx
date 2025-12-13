// src/app/blog/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from 'date-fns';
import { nlBE } from 'date-fns/locale';
import { adminDb } from "@/lib/server/firebase-admin"; // SERVER-SIDE DB!
import type { Metadata } from 'next';
import BackButton from "@/components/blog/BackButton";
import { ProductCard } from "@/components/blog/product-card";
import { type Product } from "@/types/product";

// --- Types voor deze pagina ---
interface PostSection {
  id: string;
  subTitle: string;
  content: string;
  items: Product[];
}

interface Post {
  id:string;
  headTitle: string;
  headDescription: string;
  headImage: string;
  subDescription: string;
  authorName: string; // Zorg dat dit veld bestaat in je Firestore document
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  sections: PostSection[];
}


// --- Data Fetching Functie ---
async function getPost(id: string): Promise<Post | null> {
  const postRef = adminDb.collection("posts").doc(id);
  const snap = await postRef.get();

  if (!snap.exists) {
    return null;
  }

  return { id: snap.id, ...snap.data() } as Post;
}


// --- SEO Magie: Dynamische Metadata ---
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getPost(params.id);

  if (!post) {
    return {
      title: "Post Niet Gevonden",
      description: "De opgevraagde blogpost kon niet worden gevonden."
    };
  }

  return {
    title: `${post.headTitle} | Wish2Share Blog`,
    description: post.headDescription,
    openGraph: {
        title: post.headTitle,
        description: post.headDescription,
        images: [post.headImage],
    },
  };
}


// --- De Pagina Component ---
export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  const postDate = post.createdAt?._seconds 
    ? format(new Date(post.createdAt._seconds * 1000), 'd MMMM yyyy', { locale: nlBE })
    : "Onbekende datum";

  return (
    <main className="bg-white py-12 md:py-16">
      <div className="container max-w-4xl mx-auto px-4">
        <BackButton />

        <article className="mt-8">
          <header>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              {post.headTitle}
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Gepubliceerd op {postDate} door {post.authorName || 'het Wish2Share team'}
            </p>
          </header>

          <p className="mt-6 text-xl text-gray-700 leading-relaxed">
            {post.headDescription}
          </p>

          {post.headImage && (
            <div className="relative w-full aspect-video mt-8 rounded-lg overflow-hidden">
              <Image
                src={post.headImage}
                alt={post.headTitle}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 896px, 896px"
              />
            </div>
          )}

          {post.subDescription && (
            <p className="mt-8 text-lg text-gray-700 leading-relaxed">
              {post.subDescription}
            </p>
          )}
          
          {post.sections?.map((section) => (
            <section key={section.id} className="mt-12">
              {section.subTitle && (
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 border-b pb-2 mb-6">
                  {section.subTitle}
                </h2>
              )}

              {section.content && (
                <div
                  className="prose prose-lg max-w-none prose-p:text-gray-700 prose-a:text-blue-600 hover:prose-a:text-blue-500"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              )}

              {section.items?.length > 0 && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}