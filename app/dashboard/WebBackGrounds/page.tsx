"use client";

import React, { useState, useEffect } from "react";
import { Trash, Upload, ImageOff } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import { db, app } from "@/lib/firebase";

import { Switch } from "@/components/ui/switch";
import EventBackGrounds from "@/app/dashboard/WebBackGrounds/EventBackGrounds";
import WishlistBackGrounds from "@/app/dashboard/WebBackGrounds/WishlistBackGrounds";
import BackgroundCategoryManager from "@/components/BackgroundManager";

interface BackImage {
  id: string;
  imageLink: string;
  title: string;
  isLive: boolean;
  category?: string;
}

interface Category {
  id: string;
  name: string;
  type: "wishlist" | "event" | "web";
}

export default function WebBackGrounds() {
  const [images, setImages] = useState<BackImage[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageTitle, setImageTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageCollectionRef = collection(db, "WebBackImages");
  const categoriesCollectionRef = collection(db, "backgroundCategories");
  const [isDeleting, setIsDeleting] = useState(false);
  const storage = getStorage(app);

  // Preview
  useEffect(() => {
    if (!imageFile) return setImagePreview(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(categoriesCollectionRef, where("type", "==", "web"));
        const querySnapshot = await getDocs(q);
        const categoryList = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Category[];

        setCategories(categoryList);

        if (categoryList.length > 0 && !selectedCategory) {
          setSelectedCategory(categoryList[0].id);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const querySnapshot = await getDocs(imageCollectionRef);
        const imageList = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as BackImage[];
        setImages(imageList);
      } catch (err) {
        console.error("Error fetching images:", err);
      }
    };

    fetchImages();
  }, []);

  // Add category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name.");
      return;
    }

    try {
      const newCategory = {
        name: newCategoryName,
        type: "web" as const,
      };

      const docRef = await addDoc(categoriesCollectionRef, newCategory);

      const createdCategory = { ...newCategory, id: docRef.id };
      setCategories((prev) => [...prev, createdCategory]);
      setSelectedCategory(createdCategory.id);
      setNewCategoryName("");
    } catch (err) {
      console.error("Error adding category:", err);
    }
  };

  // Upload new image
  const handleUpload = async () => {
    if (!imageFile || !imageTitle.trim()) {
      alert("Please select an image and provide a title.");
      return;
    }

    try {
      setUploadError("");
      setUploadProgress(0);

      const uniqueFileName = `${Date.now()}-${imageFile.name}`;
      const storageRef = ref(
        storage,
        `public/WebBackgrounds/${uniqueFileName}`
      );

      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        "state_changed",
        (snapshot) =>
          setUploadProgress(
            Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            )
          ),

        (error) => {
          console.error("Error uploading:", error);
          setUploadError("Upload failed.");
          setUploadProgress(null);
        },

        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            const newImage = {
              title: imageTitle,
              imageLink: downloadURL,
              isLive: false,
              category: selectedCategory,
            };

            const docRef = await addDoc(imageCollectionRef, newImage);

            setImages((prev) => [...prev, { ...newImage, id: docRef.id }]);
            setUploadProgress(null);
            setImageFile(null);
            setImageTitle("");
          } catch (err) {
            console.error("Error saving to Firestore:", err);
            setUploadError("Save failed.");
            setUploadProgress(null);
          }
        }
      );
    } catch (err) {
      console.error("Unexpected error:", err);
      setUploadError("Unexpected error.");
      setUploadProgress(null);
    }
  };

  // Delete image
  const handleDelete = async (id: string) => {
    setIsDeleting(true);

    try {
      const imageDoc = doc(db, "WebBackImages", id);
      await deleteDoc(imageDoc);

      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      console.error("Error deleting image:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Set live background
  const handleSetLive = async (id: string) => {
    try {
      const imageDoc = doc(db, "WebBackImages", id);
      const selectedImage = images.find((i) => i.id === id);
      if (!selectedImage) return;

      const batch = writeBatch(db);

      batch.set(imageDoc, { isLive: true }, { merge: true });

      images.forEach((img) => {
        if (img.id !== id && img.isLive) {
          batch.set(doc(db, "WebBackImages", img.id), { isLive: false });
        }
      });

      await batch.commit();

      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, isLive: true } : { ...img, isLive: false }
        )
      );
    } catch (err) {
      console.error("Error setting live:", err);
    }
  };

  const filteredImages = selectedCategory
    ? images.filter((img) => img.category === selectedCategory)
    : images;

  return (
    <>
      <BackgroundCategoryManager />

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-warm-olive mb-2">
            Manage Website Backgrounds
          </h1>
          <p className="text-gray-600">
            Refresh the page after setting a background image.
          </p>
        </div>

        {/* Images grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="relative group border rounded-lg overflow-hidden shadow-md"
            >
              <img
                src={image.imageLink}
                alt={image.title}
                className="w-full h-40 object-cover"
              />

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  disabled={isDeleting}
                  onClick={() => handleDelete(image.id)}
                  className="bg-[#b34c4c] text-white p-2 rounded-full hover:bg-red-600 disabled:cursor-not-allowed"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col xs:flex-row gap-3 items-center justify-between bg-gray-800 text-white text-sm p-2">
                <div>
                  {image.title}
                  {image.category && (
                    <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">
                      {categories.find((c) => c.id === image.category)?.name}
                    </span>
                  )}
                </div>

                <Switch
                  checked={image.isLive}
                  onCheckedChange={() => handleSetLive(image.id)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Upload new image */}
        <div className="bg-white p-4 shadow-md rounded-lg">
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            Add New Background
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Enter image title"
              />
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Preview
              </label>

              <div className="border rounded-md p-3 bg-gray-50">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 rounded mx-auto object-contain"
                    />

                    <button
                      onClick={handleClearImage}
                      className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-100"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                    <ImageOff className="w-12 h-12 mb-2" />
                    <p>No image selected</p>
                  </div>
                )}
              </div>
            </div>

            {/* File input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm"
              />
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              className="flex items-center px-4 py-2 bg-[#606C38] text-white rounded-md hover:bg-[#404825]"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Image
            </button>

            {/* Progress */}
            {uploadProgress !== null && (
              <div className="mt-4">
                <p>Uploading: {uploadProgress}%</p>
                <div className="w-full bg-gray-300 rounded">
                  <div
                    className="bg-green-500 text-xs font-medium text-white text-center p-1 rounded"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              </div>
            )}

            {uploadError && (
              <p className="mt-2 text-[#b34c4c]">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      <WishlistBackGrounds />
      <EventBackGrounds />
    </>
  );
}
