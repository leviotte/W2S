"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2 } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { app, db, auth } from "@/lib/client/firebase";
import { useRouter } from "next/navigation";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { AffiliateProducts } from "@/components/AffiliateProducts";
import { toast } from "sonner";

// Dynamically import ReactQuill for client-side only
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

// Types
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

interface Section {
  subTitle: string;
  content: string;
  items: WishlistItem[];
}

// SectionEditor component
const SectionEditor = ({
  section,
  index,
  removeSection,
  updateSection,
  addItemToBlog,
  removeItemFromSection,
}: {
  section: Section;
  index: number;
  removeSection: (index: number) => void;
  updateSection: (index: number, field: keyof Section, value: string) => void;
  addItemToBlog: (sectionIndex: number, product: AmazonProduct) => void;
  removeItemFromSection: (sectionIndex: number, itemId: string) => void;
}) => (
  <div className="space-y-4 p-4 border rounded-lg relative">
    <div className="flex justify-between items-center">
      <label className="block text-sm font-medium text-gray-600">
        Section {index + 1}
      </label>
      {index > 0 && (
        <button
          onClick={() => removeSection(index)}
          className="p-1 text-[#b34c4c] hover:bg-red-50 rounded-full"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}
    </div>

    <div className="input-group">
      <label className="block text-sm font-medium text-gray-600">Sub Title:</label>
      <input
        className="w-full p-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
        type="text"
        placeholder="Title..."
        value={section.subTitle}
        onChange={(e) => updateSection(index, "subTitle", e.target.value)}
      />
    </div>

    <div className="mt-4">
      <ReactQuill
        theme="snow"
        value={section.content}
        onChange={(value) => updateSection(index, "content", value)}
        placeholder="Write detailed content here..."
      />
    </div>

    {section.items.length > 0 && (
      <div className="mt-4">
        <h3 className="text-md font-semibold">Added Items:</h3>
        <ul className="space-y-2">
          {section.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-2 border rounded-md">
              {item.image && <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-md" />}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.price && <p className="text-xs text-gray-600">{item.price}</p>}
              </div>
              <button
                onClick={() => removeItemFromSection(index, item.id)}
                className="p-1 text-[#b34c4c] hover:bg-red-600 rounded-full"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="mb-10 lg:px-10 lg:mx-10 py-10 pt-2">
      <AffiliateProducts addItemToBlog={(product) => addItemToBlog(index, product)} />
    </div>
  </div>
);

// Main Page Component
export default function CreatePostPage() {
  const [headTitle, setHeadTitle] = useState("");
  const [headDescription, setHeadDescriptionText] = useState("");
  const [headImage, setHeadImage] = useState<File | string>("");
  const [subDescription, setSubDescriptionText] = useState("");
  const [sections, setSections] = useState<Section[]>([{ subTitle: "", content: "", items: [] }]);
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const router = useRouter();
  const postsCollectionRef = collection(db, "posts");

  const handleUploadImage = useCallback(async () => {
    if (!headImage || !(headImage instanceof File)) {
      setImageUploadError("Please select a valid image to upload");
      return;
    }
    setImageUploadError(null);
    const storage = getStorage(app);
    const fileName = `public/posts/${Date.now()}-${headImage.name}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, headImage);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageUploadProgress(+progress.toFixed(0));
      },
      (error) => {
        console.error(error);
        setImageUploadError("Image upload failed. Please try again.");
        setImageUploadProgress(null);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setHeadImage(downloadURL);
        setImageUploadProgress(null);
      }
    );
  }, [headImage]);

  const addSection = () => setSections([...sections, { subTitle: "", content: "", items: [] }]);
  const updateSection = (index: number, field: keyof Section, value: string) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };
  const removeSection = (index: number) => setSections(sections.filter((_, i) => i !== index));
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
                  image: product.ImageURL || "",
                  description: product.Features?.join(", ") || "",
                  url: product.URL || "",
                  price: product.Price || "",
                },
              ],
            }
          : section
      )
    );
  };
  const removeItemFromSection = (sectionIndex: number, itemId: string) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === sectionIndex
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section
      )
    );
  };

  const createPost = async () => {
    if (!headTitle.trim()) return toast.error("Title is required.");
    if (!headImage || headImage instanceof File) return toast.error("Please upload an image before submitting.");
    if (!auth.currentUser) return toast.error("You must be logged in to create a post.");

    await addDoc(postsCollectionRef, {
      headTitle,
      headDescription,
      headImage,
      subDescription,
      sections,
      createdAt: serverTimestamp(),
      author: { name: auth.currentUser.displayName, id: auth.currentUser.uid },
    });

    toast.success("Post created successfully!");
    router.push("/blog");
  };

  return (
    <div className="flex justify-center items-center min-h-screen pb-5">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-xl max-h-full shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-700 text-center">Create Post</h1>

        <div className="space-y-4">
          {/* Title */}
          <div className="input-group">
            <label className="block text-sm font-medium text-gray-600">Title:</label>
            <input
              className="w-full p-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              type="text"
              placeholder="Enter the blog title..."
              value={headTitle}
              onChange={(e) => setHeadTitle(e.target.value)}
            />
          </div>

          {/* Head Description */}
          <div className="input-group">
            <label className="block text-sm font-medium text-gray-600">Head Description:</label>
            <textarea
              className="w-full p-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Enter a description for the blog..."
              rows={2}
              value={headDescription}
              onChange={(e) => setHeadDescriptionText(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div className="input-group">
            <label className="block text-sm font-medium text-gray-600">Add Image:</label>
            <div className="flex flex-row border rounded-md focus:outline-none px-4">
              <input
                className="w-full p-2 mt-1 focus:ring-2 focus:ring-lime-500"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setHeadImage(e.target.files[0])}
              />
              <button
                className="px-2 py-1 mt-auto mb-auto text-white bg-warm-olive rounded-md hover:bg-lime-600 transition duration-300 ease-in-out"
                onClick={handleUploadImage}
              >
                Upload
              </button>
            </div>
            {imageUploadError && <span className="text-red-400">{imageUploadError}</span>}
            {imageUploadProgress !== null && <span>{imageUploadProgress}% uploading...</span>}
            {typeof headImage === "string" && (
              <div className="mt-2">
                <img src={headImage} alt="Uploaded" className="w-full h-auto rounded-md" />
              </div>
            )}
          </div>

          {/* Sub Description */}
          <div className="input-group">
            <label className="block text-sm font-medium text-gray-600">Sub Description:</label>
            <textarea
              className="w-full p-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="This description comes below the image..."
              rows={2}
              value={subDescription}
              onChange={(e) => setSubDescriptionText(e.target.value)}
            />
          </div>

          {/* Sections */}
          {sections.map((section, index) => (
            <SectionEditor
              key={index}
              section={section}
              index={index}
              removeSection={removeSection}
              updateSection={updateSection}
              addItemToBlog={addItemToBlog}
              removeItemFromSection={removeItemFromSection}
            />
          ))}

          <button
            onClick={addSection}
            className="flex items-center gap-2 px-4 py-2 text-lime-600 border border-lime-600 rounded-md hover:bg-lime-50"
          >
            <Plus className="h-4 w-4" /> Add Section
          </button>

          <button
            className="w-full p-2 mt-4 text-white bg-warm-olive rounded-md hover:bg-lime-600 transition duration-300 ease-in-out"
            onClick={createPost}
          >
            Submit Post
          </button>
        </div>
      </div>
    </div>
  );
}
