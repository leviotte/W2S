'use client';

import { useState, useEffect, useTransition } from "react";
import { Trash, Upload, PlusCircle } from "lucide-react";
import { BackgroundCategory, BackgroundImage, BackgroundUploadData } from "@/modules/dashboard/backgrounds.types";
import * as backgroundsActions from "@/modules/dashboard/backgrounds.actions.server";

export default function EventBackGroundsPage() {
  const [images, setImages] = useState<BackgroundImage[]>([]);
  const [categories, setCategories] = useState<BackgroundCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPending, startTransition] = useTransition();

  // -------------------------
  // FETCH CATEGORIES + IMAGES
  // -------------------------
  const fetchCategories = async () => {
    const cats = await backgroundsActions.getCategories("event");
    setCategories(cats);
  };

  const fetchImages = async () => {
    const imgs = await backgroundsActions.getBackgroundImages(filterCategory || undefined);
    setImages(imgs);
  };

  useEffect(() => { fetchCategories(); fetchImages(); }, [filterCategory]);

  // -------------------------
  // IMAGE PREVIEW
  // -------------------------
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  // -------------------------
  // HANDLERS
  // -------------------------
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return alert("Enter category name");
    const cat = await backgroundsActions.addCategory(newCategoryName, "event");
    setCategories((prev) => [...prev, cat]);
    setNewCategoryName("");
    setIsAddingCategory(false);
  };

  const handleUpload = async () => {
    if (!imageFile || !imageTitle.trim() || !selectedCategory) return alert("Select file, title, category");

    setUploadError("");
    setUploadProgress(0);

    try {
      const newImage = await backgroundsActions.uploadBackgroundImage({ title: imageTitle, category: selectedCategory, file: imageFile } as BackgroundUploadData);
      setImages((prev) => [...prev, newImage]);
      setImageFile(null);
      setImagePreview(null);
      setImageTitle("");
      setUploadProgress(null);
    } catch (err: any) {
      console.error(err);
      setUploadError(err?.message || "Upload failed");
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    setIsDeleting(true);
    try {
      await backgroundsActions.deleteBackgroundImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] || null);
  const handleClearImage = () => { setImageFile(null); setImagePreview(null); };

  // -------------------------
  // FILTERED IMAGES
  // -------------------------
  const filteredImages = filterCategory ? images.filter((img) => img.category === filterCategory) : images;

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-warm-olive mb-2">Manage Event Backgrounds</h1>
        <p className="text-gray-600 text-sm">Select a category to filter backgrounds or add new ones.</p>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {filteredImages.map((img) => (
          <div key={img.id} className="relative group border rounded-lg overflow-hidden shadow-md">
            <img src={img.imageLink} alt={img.title} className="w-full h-40 object-cover" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
              <button disabled={isDeleting} onClick={() => handleDelete(img.id)} className="bg-[#b34c4c] disabled:cursor-not-allowed text-white p-2 rounded-full hover:bg-red-600">
                <Trash className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-800 text-white text-sm p-2 flex justify-between items-center">
              <span>{img.title}</span>
              {img.category && (
                <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                  {categories.find((c) => c.id === img.category)?.name || ""}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-white p-4 shadow-md rounded-lg space-y-4">
        <h2 className="text-lg font-bold text-gray-700">Add New Event Background</h2>
        <input type="text" value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} placeholder="Enter image title" className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />

        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <button onClick={() => setIsAddingCategory(true)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <PlusCircle className="w-4 h-4 mr-1" /> Add Category
          </button>
        </div>

        {isAddingCategory ? (
          <div className="p-3 border rounded-md mb-3">
            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            <div className="flex mt-2 space-x-2">
              <button onClick={handleAddCategory} className="px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600">Save</button>
              <button onClick={() => setIsAddingCategory(false)} className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        ) : (
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="" disabled>Select a category</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
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
