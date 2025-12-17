"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { BlogPost } from "@/types/blog";
import { toDate } from "@/lib/utils/date";

export default function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="bg-white rounded-lg shadow">
      <Link href={`/blog/${post.slug}`}>
        <Image
          src={post.headImage}
          alt={post.headTitle}
          width={800}
          height={450}
          className="rounded-t-lg object-cover"
        />
      </Link>

      <div className="p-4">
        <h2 className="font-semibold text-lg">{post.headTitle}</h2>
        <p className="text-gray-600 mt-2">{post.headDescription}</p>

        <p className="text-sm text-gray-400 mt-4">
          {format(toDate(post.createdAt), "d MMMM yyyy", { locale: nl })}
        </p>

        <Link
          href={`/blog/${post.slug}`}
          className="text-accent font-semibold mt-3 inline-block"
        >
          Lees meer →
        </Link>
      </div>
    </article>
  );
}
