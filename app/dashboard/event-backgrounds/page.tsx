"use client";

import { useState, useEffect } from "react";
import { Trash, Upload, PlusCircle, ImageOff } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, app } from "@/config/firebase";

interface BackImage {
  id: string;
  imageLink: string;
  title: string;
  category?: string;
}

interface Category {
  id: string;
  name: string;
  type: "wishlist" | "event" | "web";
}

export default function EventBackGroundsPage() {
  const [images, setImages] = useState<BackImage[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterSelectedCategory, setFilterSelectedCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const imageCollectionRef = collection(db, "EventBackImages");
  const categoriesCollectionRef = collection(db, "backgroundCategories");
  const storage = getStorage(app);

  // Realtime categories listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      categoriesCollectionRef,
      (snapshot) => {
        const categoryList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(categoryList.filter((i) => i.type === "event"));
      },
      (error) => console.error("Error listening to categories:", error)
    );
    return () => unsubscribe();
  }, []);

  // Fetch images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const querySnapshot = await getDocs(imageCollectionRef);
        const imageList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BackImage[];
        setImages(imageList);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };
    fetchImages();
  }, []);

  // Image preview
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return alert("Please enter a category name.");
    try {
      const newCategory = { name: newCategoryName, type: "event" as const };
      const docRef = await addDoc(categoriesCollectionRef, newCategory);
      setCategories([...categories, { ...newCategory, id: docRef.id }]);
      setNewCategoryName("");
      setIsAddingCategory(false);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleUpload = async () => {
    if (!imageFile || !imageTitle.trim() || !selectedCategory) {
      return alert("Please select an image, provide a title, and select a category.");
    }

    setUploadError("");
    setUploadProgress(0);

    const uniqueFileName = `${Date.now()}-${imageFile.name}`;
    const storageRef = ref(storage, `public/eventBackgrounds/${uniqueFileName}`);
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      (error) => {
        console.error("Error uploading image:", error);
        setUploadError("Image upload failed. Please try again.");
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newImage = { title: imageTitle, imageLink: downloadURL, category: selectedCategory };
          const docRef = await addDoc(imageCollectionRef, newImage);
          setImages((prev) => [...prev, { ...newImage, id: docRef.id }]);
          setUploadProgress(null);
          setImageFile(null);
          setImagePreview(null);
          setImageTitle("");
        } catch (error) {
          console.error("Error saving image to Firestore:", error);
          setUploadError("Failed to save image to Firestore. Please try again.");
          setUploadProgress(null);
        }
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0] || null);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const imageDoc = doc(db, "EventBackImages", id);
      await deleteDoc(imageDoc);
      setImages((prev) => prev.filter((image) => image.id !== id));
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredImages = filterSelectedCategory
    ? images.filter((img) => img.category === filterSelectedCategory)
    : images;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-warm-olive mb-2">Manage Event Backgrounds</h1>
        <p className="text-gray-600 text-sm">
          Select a category to filter backgrounds or add new ones.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
        <select
          value={filterSelectedCategory}
          onChange={(e) => setFilterSelectedCategory(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {filteredImages.map((image) => (
          <div key={image.id} className="relative group border rounded-lg overflow-hidden shadow-md">
            <img src={image.imageLink} alt={image.title} className="w-full h-40 object-cover" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(image.id)}
                className="bg-[#b34c4c] disabled:cursor-not-allowed text-white p-2 rounded-full hover:bg-red-600"
              >
                <Trash className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-800 text-white text-sm p-2 flex justify-between items-center">
              <span>{image.title}</span>
              {image.category && (
                <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                  {categories.find((c) => c.id === image.category)?.name || ""}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-white p-4 shadow-md rounded-lg space-y-4">
        <h2 className="text-lg font-bold text-gray-700">Add New Event Background</h2>

        <input
          type="text"
          value={imageTitle}
          onChange={(e) => setImageTitle(e.target.value)}
          placeholder="Enter image title"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <button onClick={() => setIsAddingCategory(true)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <PlusCircle className="w-4 h-4 mr-1" /> Add Category
          </button>
        </div>

        {isAddingCategory ? (
          <div className="p-3 border rounded-md mb-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="New category name"
            />
            <div className="flex mt-2 space-x-2">
              <button onClick={handleAddCategory} className="px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600">Save</button>
              <button onClick={() => setIsAddingCategory(false)} className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        )}

        <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#606C38]/30 file:text-[#606C38] hover:file:bg-[#606C38]/60" />

        {imagePreview && (
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="max-h-48 rounded max-w-full mx-auto object-contain" />
            <button onClick={handleClearImage} className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-100">
              <Trash className="w-4 h-4" />
            </button>
          </div>
        )}

        <button onClick={handleUpload} className="flex items-center px-4 py-2 text-white rounded-md bg-[#606C38] hover:bg-[#2f351a]">
          <Upload className="w-5 h-5 mr-2" /> Upload Image
        </button>

        {uploadProgress !== null && (
          <div className="mt-4">
            <p>Uploading: {uploadProgress}%</p>
            <div className="w-full bg-gray-300 rounded">
              <div className="bg-green-500 text-xs font-medium text-white text-center p-1 rounded" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          </div>
        )}
        {uploadError && <p className="mt-2 text-[#b34c4c]">{uploadError}</p>}
      </div>
    </div>
  );
}
