import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import BackButton from "./BackButton";

export default async function PostPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const postRef = doc(db, "posts", id);
  const snap = await getDoc(postRef);

  if (!snap.exists()) {
    return notFound();
  }

  const post = { id: snap.id, ...snap.data() } as any;

  return (
    <div className="max-w-6xl mx-auto p-6 mt-16 bg-white rounded-lg">
      <BackButton />

      <h1 className="text-5xl text-indigo-950 font-bold mt-10 mb-5">
        {post.headTitle}
      </h1>

      <p className="text-gray-500 text-xl mt-6 font-semibold">
        {post.createdAt?.seconds
          ? new Date(post.createdAt.seconds * 1000).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "N/A"}
      </p>

      <p className="mt-2 text-2xl font-sans text-gray-700">{post.headDescription}</p>

      {post.headImage && (
        <Image
          src={post.headImage}
          alt="Header image"
          width={1600}
          height={900}
          className="w-full mt-4 rounded-lg object-cover"
        />
      )}

      <p className="mt-4 text-2xl font-sans text-gray-700">
        {post.subDescription}
      </p>

      {post.sections?.map((section: any, index: number) => (
        <div key={index} className="mt-10">
          {section.subTitle && (
            <h2 className="text-4xl font-semibold text-indigo-950">
              {section.subTitle}
            </h2>
          )}

          {section.content && (
            <div
              className="mt-4 text-gray-500 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}

          {/* Items grid */}
          {section.items && Array.isArray(section.items) && (
            <div className="flex flex-wrap -mx-2 mt-6">
              {section.items.map((item: any, i: number) => (
                <div key={i} className="w-full sm:w-1/2 md:w-1/3 px-2 mb-4">
                  <div className="max-w-sm h-full flex flex-col rounded overflow-hidden shadow-lg bg-white">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={800}
                      height={600}
                      className="w-full h-48 object-cover"
                    />

                    <div className="px-6 py-4 flex-grow">
                      <div className="font-bold text-xl mb-2">{item.title}</div>
                      <p className="text-gray-700 text-xl">{item.price}</p>
                    </div>

                    <div className="px-6 py-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Bekijk product
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
