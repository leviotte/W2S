"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactQuill from "react-quill";

import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import { Plus, Trash2 } from "lucide-react";
import AffiliateProducts from "@/components/AffliateProductsOnBlog";

interface AmazonProduct {
  ASIN: string;
  URL?: string;
  Title: string;
  ImageURL?: string;
  Price?: string;
  Saving?: string;
  PriceWithoutSavaing?: string;
  Features: string[];
}

interface WishlistItem {
  id: string;
  title: string;
  image?: string;
  description: string;
  url?: string;
  price?: string;
}

export default function UpdatePostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [headTitle, setHeadTitle] = useState("");
  const [headDescription, setHeadDescriptionText] = useState("");
  const [headImage, setHeadImage] = useState<File | string>("");
  const [subDescription, setSubDescriptionText] = useState("");
  const [sections, setSections] = useState([
    { subTitle: "", content: "", items: [] as WishlistItem[] },
  ]);

  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Fetch post data
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const postRef = doc(db, "posts", id);
      const snap = await getDoc(postRef);

      if (snap.exists()) {
        const post = snap.data();
        setHeadTitle(post.headTitle);
        setHeadDescriptionText(post.headDescription);
        setHeadImage(post.headImage);
        setSubDescriptionText(post.subDescription);
        setSections(post.sections);
      }
    };

    load();
  }, [id]);

  const addItemToBlog = (sectionIndex: number, product: AmazonProduct) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: crypto.randomUUID(),
                  title: product.Title,
                  image: product.ImageURL ?? "",
                  description: product.Features?.join(", ") || "",
                  url: product.URL ?? "",
                  price: product.Price ?? "",
                },
              ],
            }
          : section
      )
    );
  };

  const handleUploadImage = async () => {
    if (!headImage || !(headImage instanceof File)) {
      setImageUploadError("Kies een geldige afbeelding");
      return;
    }

    setImageUploadError(null);

    const storage = getStorage();
    const name = `public/posts/${Date.now()}-${headImage.name}`;
    const storageRef = ref(storage, name);

    const uploadTask = uploadBytesResumable(storageRef, headImage);

    uploadTask.on(
      "state_changed",
      (snap) => {
        const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setImageUploadProgress(progress);
      },
      (error) => {
        setImageUploadError("Upload mislukt: " + error.message);
        setImageUploadProgress(null);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setHeadImage(url);
        setImageUploadProgress(null);
      }
    );
  };

  const updatePost = async () => {
    const refPost = doc(db, "posts", id);

    await updateDoc(refPost, {
      headTitle,
      headDescription,
      headImage,
      subDescription,
      sections,
      updatedAt: new Date(),
      author: {
        name: auth.currentUser?.displayName,
        id: auth.currentUser?.uid,
      },
    });

    router.push(`/post/${id}`);
  };

  const addSection = () => {
    setSections([...sections, { subTitle: "", content: "", items: [] }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const removeItemFromSection = (sIndex: number, itemId: string) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === sIndex
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section
      )
    );
  };

  const updateSection = (index: number, field: string, value: string) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === index ? { ...sec, [field]: value } : sec))
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold text-center">Update Post</h1>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Titel</label>
          <input
            value={headTitle}
            onChange={(e) => setHeadTitle(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>

        {/* Head Description */}
        <div>
          <label className="block text-sm font-medium">Beschrijving</label>
          <ReactQuill value={headDescription} onChange={setHeadDescriptionText} />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium">Header Afbeelding</label>
          <input
            type="file"
            onChange={(e) => setHeadImage(e.target.files?.[0] || "")}
            className="mt-2"
          />

          {typeof headImage === "string" && headImage !== "" && (
            <img src={headImage} className="mt-3 rounded shadow w-60" />
          )}

          <button
            onClick={handleUploadImage}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Upload
          </button>

          {imageUploadProgress !== null && (
            <p className="text-sm mt-1">Upload: {imageUploadProgress}%</p>
          )}

          {imageUploadError && <p className="text-red-500">{imageUploadError}</p>}
        </div>

        {/* Sub Text */}
        <div>
          <label className="block text-sm font-medium">Sub tekst</label>
          <ReactQuill value={subDescription} onChange={setSubDescriptionText} />
        </div>

        {/* Sections */}
        {sections.map((section, i) => (
          <div key={i} className="border p-4 rounded-lg mt-6">
            <div className="flex justify-between">
              <h2 className="font-semibold">Sectie {i + 1}</h2>
              <button
                onClick={() => removeSection(i)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <input
              value={section.subTitle}
              onChange={(e) => updateSection(i, "subTitle", e.target.value)}
              placeholder="Subtitel"
              className="w-full p-2 border rounded mt-2"
            />

            <ReactQuill
              value={section.content}
              onChange={(v) => updateSection(i, "content", v)}
              className="mt-3"
            />

            <AffiliateProducts
              onSelect={(product) => addItemToBlog(i, product)}
            />

            {/* Items */}
            <div className="mt-4 space-y-3">
              {section.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                  <span>{item.title}</span>
                  <button onClick={() => removeItemFromSection(i, item.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addSection}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded"
        >
          <Plus size={16} /> Sectie toevoegen
        </button>

        {/* Save */}
        <button
          onClick={updatePost}
          className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg"
        >
          Post updaten
        </button>
      </div>
    </div>
  );
}
