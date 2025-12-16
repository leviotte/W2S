// src/app/dashboard/web-backgrounds/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Trash, Upload, ImageOff } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
  query,
  where,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

// Aanname: je hebt een client-side firebase initialisatie in dit pad.
import { db, app } from "@/lib/client/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// TODO: We zullen de BackgroundCategoryManager later als een apart component bouwen.
// import BackgroundCategoryManager from "@/components/background/BackgroundManager";

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

export default function WebBackGroundsPage() {
  const [images, setImages] = useState<BackImage[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageTitle, setImageTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const imageCollectionRef = collection(db, "WebBackImages");
  const categoriesCollectionRef = collection(db, "backgroundCategories");
  const storage = getStorage(app);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(imageFile);

    // Cleanup function
    return () => {
      reader.onloadend = null;
    };
  }, [imageFile]);

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(categoriesCollectionRef, where("type", "==", "web"));
        const querySnapshot = await getDocs(q);
        const categoryList = querySnapshot.docs.map(d => ({
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
  }, [categoriesCollectionRef, selectedCategory]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const querySnapshot = await getDocs(imageCollectionRef);
        const imageList = querySnapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as BackImage[];
        setImages(imageList);
      } catch (err) {
        console.error("Error fetching images:", err);
      }
    };
    fetchImages();
  }, [imageCollectionRef]);

  const handleUpload = async () => {
    if (!imageFile || !imageTitle.trim()) {
      alert("Selecteer een afbeelding en geef een titel op.");
      return;
    }
    try {
      setUploadError("");
      setUploadProgress(0);
      const uniqueFileName = `${Date.now()}-${imageFile.name}`;
      const storageRef = ref(storage, `public/WebBackgrounds/${uniqueFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
        (error) => {
          console.error("Error uploading:", error);
          setUploadError("Upload mislukt.");
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
            setImagePreview(null);
          } catch (err) {
            console.error("Error saving to Firestore:", err);
            setUploadError("Opslaan in database mislukt.");
            setUploadProgress(null);
          }
        }
      );
    } catch (err) {
      console.error("Unexpected error:", err);
      setUploadError("Onverwachte fout.");
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Weet je zeker dat je deze afbeelding wilt verwijderen?")) return;
    setIsDeleting(true);
    try {
      const imageDoc = doc(db, "WebBackImages", id);
      await deleteDoc(imageDoc);
      // TODO: Verwijder ook de afbeelding uit Firebase Storage om kosten te besparen.
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      console.error("Error deleting image:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetLive = async (id: string) => {
    try {
      const imageDocRef = doc(db, "WebBackImages", id);
      const batch = writeBatch(db);

      // Zet de geselecteerde afbeelding op 'live'
      batch.update(imageDocRef, { isLive: true });

      // Zet alle andere afbeeldingen op 'not live'
      images.forEach((img) => {
        if (img.id !== id && img.isLive) {
          const otherImageDocRef = doc(db, "WebBackImages", img.id);
          batch.update(otherImageDocRef, { isLive: false });
        }
      });

      await batch.commit();

      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          isLive: img.id === id,
        }))
      );
    } catch (err) {
      console.error("Error setting live:", err);
    }
  };

  const filteredImages = selectedCategory
    ? images.filter((img) => img.category === selectedCategory)
    : images;

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-warm-olive mb-2">
          Website Achtergronden Beheren
        </h1>
        <p className="text-muted-foreground">
          Upload, beheer en activeer achtergrondafbeeldingen voor de website.
        </p>
      </div>

      {/* TODO: BackgroundCategoryManager component hier invoegen */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {filteredImages.map((image) => (
          <Card key={image.id} className="relative group overflow-hidden">
            <img src={image.imageLink} alt={image.title} className="w-full h-40 object-cover" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                disabled={isDeleting}
                onClick={() => handleDelete(image.id)}
              >
                <Trash className="w-5 h-5" />
              </Button>
            </div>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold truncate pr-2">{image.title}</p>
                <Switch
                  checked={image.isLive}
                  onCheckedChange={() => handleSetLive(image.id)}
                  aria-label="Set live background"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nieuwe Achtergrond Toevoegen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              type="text"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              placeholder="bv. 'Zomerse vibes'"
            />
          </div>

          <div>
            <Label>Afbeelding Preview</Label>
            <div className="mt-2 border rounded-md p-3 bg-muted min-h-[150px] flex justify-center items-center">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 rounded object-contain" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7"
                    onClick={handleClearImage}
                  >
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
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button onClick={handleUpload} disabled={uploadProgress !== null}>
            <Upload className="w-5 h-5 mr-2" />
            {uploadProgress !== null ? `Bezig met uploaden... ${uploadProgress}%` : 'Upload Afbeelding'}
          </Button>

          {uploadProgress !== null && (
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}

          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}