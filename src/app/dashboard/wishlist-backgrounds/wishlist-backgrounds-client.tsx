'use client';

import { useState, useEffect } from "react";
import { Trash, Upload, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WishlistBackImage, WishlistCategory } from "@/types/wishlist-backgrounds";
import {
  uploadWishlistBackImage,
  deleteWishlistBackImage,
  setLiveWishlistBackImage,
} from "./wishlist-backgrounds.server";

interface Props {
  initialImages: WishlistBackImage[];
  initialCategories: WishlistCategory[];
}

export default function WishlistBackImagesClient({ initialImages, initialCategories }: Props) {
  const [images, setImages] = useState(initialImages);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageTitle, setImageTitle] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // -----------------------------
  // File preview
  // -----------------------------
  useEffect(() => {
    if (!imageFile) return setImagePreview(null);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(imageFile);

    return () => { reader.onloadend = null; };
  }, [imageFile]);

  const handleClearImage = () => { setImageFile(null); setImagePreview(null); };

  // -----------------------------
  // Upload image
  // -----------------------------
  const handleUpload = async () => {
    if (!imageFile || !imageTitle.trim()) return alert("Selecteer een afbeelding en geef een titel op.");

    setUploadError(""); setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev! < 90 ? prev! + Math.floor(Math.random() * 10) : prev));
    }, 200);

    try {
      const buffer = await imageFile.arrayBuffer();
      const newImage = await uploadWishlistBackImage(buffer, imageFile.name, imageTitle, selectedCategory);

      setImages(prev => [...prev, newImage]);
      setImageFile(null);
      setImageTitle("");
      setImagePreview(null);
      setUploadProgress(100);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Upload mislukt");
      setUploadProgress(null);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setUploadProgress(null), 500);
    }
  };

  // -----------------------------
  // Delete image
  // -----------------------------
  const handleDelete = async (id: string) => {
    if (!window.confirm("Weet je zeker dat je deze afbeelding wilt verwijderen?")) return;
    setIsDeleting(true);
    try {
      await deleteWishlistBackImage(id);
      setImages(prev => prev.filter(img => img.id !== id));
    } catch (err) { console.error(err); } 
    finally { setIsDeleting(false); }
  };

  // -----------------------------
  // Set live image
  // -----------------------------
  const handleSetLive = async (id: string) => {
    try {
      await setLiveWishlistBackImage(id);
      setImages(prev => prev.map(img => ({ ...img, isLive: img.id === id })));
    } catch (err) { console.error(err); }
  };

  const filteredImages = selectedCategory
    ? images.filter(img => img.categoryId === selectedCategory)
    : images;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-warm-olive mb-2">Wishlist Achtergronden Beheren</h1>
        <p className="text-muted-foreground">Upload, beheer en activeer achtergrondafbeeldingen voor wishlists.</p>
      </div>

      {/* Category selector */}
      <div className="flex gap-4 mb-6">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {filteredImages.map(image => (
          <Card key={image.id} className="relative group overflow-hidden">
            <img src={image.imageLink} alt={image.title} className="w-full h-40 object-cover" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="destructive" size="icon" disabled={isDeleting} onClick={() => handleDelete(image.id)}>
                <Trash className="w-5 h-5" />
              </Button>
            </div>
            <CardContent className="p-3 flex justify-between items-center">
              <p className="font-semibold truncate">{image.title}</p>
              <Switch checked={image.isLive} onCheckedChange={() => handleSetLive(image.id)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader><CardTitle>Nieuwe Achtergrond Toevoegen</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Titel</Label>
            <Input id="title" value={imageTitle} onChange={e => setImageTitle(e.target.value)} placeholder="bv. 'Zomerse vibes'" />
          </div>

          <div>
            <Label>Afbeelding Preview</Label>
            <div className="mt-2 border rounded-md p-3 bg-muted min-h-[150px] flex justify-center items-center">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 rounded object-contain" />
                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={handleClearImage}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageOff className="w-12 h-12 mx-auto mb-2" />
                  <p>Geen afbeelding geselecteerd</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="file-upload">Selecteer Afbeelding</Label>
            <Input id="file-upload" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
          </div>

          <Button onClick={handleUpload} disabled={uploadProgress !== null}>
            <Upload className="w-5 h-5 mr-2" />
            {uploadProgress !== null ? `Bezig met uploaden... ${uploadProgress}%` : 'Upload Afbeelding'}
          </Button>

          {uploadProgress !== null && (
            <div className="w-full bg-muted rounded-full h-2.5 mt-2">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
