'use client';

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "zustand";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function BlogPage() {
  const [postList, setPostList] = useState<{ id: string; [key: string]: any }[]>([]);
  const postsCollectionRef = collection(db, "posts");
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const deletePost = async (id: string) => {
    const postDoc = doc(db, "posts", id);
    await deleteDoc(postDoc);
    setPostList(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    const getPosts = async () => {
      const data = await getDocs(postsCollectionRef);
      const posts = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      posts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPostList(posts);
    };
    getPosts();
  }, [postsCollectionRef]);

  return (
    <section id="section-1" className="p-4 sm:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-gray-900 font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-2 p-2 text-center sm:text-left">
          Vind Inspiratie op onze <span className="text-warm-olive">Blog</span>
        </h1>
        {currentUser?.isAdmin && (
          <Button
            onClick={() => router.push("/create-post")}
            className="bg-warm-olive hover:bg-cool-olive text-white flex items-center gap-2 mt-4 sm:mt-0"
          >
            <Plus className="h-5 w-5" />
            Nieuw
          </Button>
        )}
      </div>

      <p className="text-gray-600 font-medium text-base sm:text-lg md:text-xl p-2 max-w-full sm:max-w-xl md:max-w-2xl mx-4 sm:mx-8 md:mx-16 mb-8 sm:mb-12 md:mb-16">
        De bron voor cadeau-ideeën en inspiratie voor je verlanglijst. Van
        trendy gadgets tot unieke items, hier vind je alles voor het perfecte
        cadeau en je ideale verlanglijst.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {postList.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden max-w-sm mb-8">
            <Link href={`/post/${post.id}`}>
              <img src={post.headImage} alt="No Image found" className="w-full h-auto" />
            </Link>
            <div className="p-4">
              <Link href={`/post/${post.id}`}>
                <h2 className="text-xl font-semibold text-slate-700">{post.headTitle}</h2>
                <p className="mt-2 text-slate-600 line-clamp-2">{post.headDescription}</p>
                <p className="mt-2 text-gray-500 text-sm">
                  {new Date(post.createdAt?.seconds * 1000).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </Link>
              <div className="flex flex-row justify-between mt-4">
                <Link href={`/post/${post.id}`} className="text-warm-olive hover:no-underline font-bold">Lees meer →</Link>
                {currentUser?.isAdmin && (
                  <div className="flex flex-row">
                    <button
                      onClick={() => router.push(`/update-post/${post.id}`)}
                      className="text-warm-olive hover:text-white font-medium ml-2 hover:bg-warm-olive rounded-full px-4 py-2 outline outline-1"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-white font-medium ml-2 bg-red-400 hover:bg-red-500 rounded-full px-4 py-2"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
