// src/app/dashboard/wishlists/create/page.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/client/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { type WishlistItem } from "@/types/wishlist";
import { createWishlistAction } from '@/lib/server/actions/wishlist';

import AffiliateProductSearch from "@/components/products/AffiliateProductSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BackImage { id: string; imageLink: string; title: string; category: string; }
interface Category { id: string; name: string; type: string; }

export default function CreateWishlistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useRequireAuth();

  const eventId = searchParams.get("event");
  const participantId = searchParams.get("participant");

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [wishlistName, setWishlistName] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [backImages, setBackImages] = useState<BackImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categorySnapshot, imageSnapshot] = await Promise.all([
          getDocs(collection(db, "backgroundCategories")),
          getDocs(collection(db, "WishlistBackImages")),
        ]);
        
        const categoriesData = categorySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Category))
          .filter(i => i.type === "wishlist");
        setCategories(categoriesData);
        
        const backgroundImagesData = imageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as BackImage);
        setBackImages(backgroundImagesData);
        setFilteredImages(backgroundImagesData);
      } catch (err) { 
        console.error("Fout bij laden achtergronddata:", err);
        toast.error("Kon achtergronden niet laden");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredImages(backImages);
    } else {
      setFilteredImages(backImages.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory, backImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wishlistName.trim()) {
      toast.error("Geef je wishlist een naam");
      return;
    }

    if (items.length === 0) {
      toast.error("Voeg minstens één item toe aan je wishlist.");
      return;
    }

    startTransition(async () => {
  try {
    // Weglaten: const formData = new FormData(); ... (alles daarvan schrappen)
    const result = await createWishlistAction({
      name: wishlistName.trim(),
      backgroundImage: backgroundImage || "...standaard-url...",
      items,
      // description, isPublic, eventId, participantId: indien gewenst!
    });

    if (result.success) {
      toast.success("Wishlist succesvol aangemaakt! 🎉");
      router.push('/dashboard/wishlists');
    } else {
      toast.error(result.message || "Er ging iets mis bij het aanmaken van de wishlist");
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach(msg => console.error(`${field}:`, msg));
          }
        });
      }
    }
  } catch (error) {
    console.error("Submit error:", error);
    toast.error("Er ging iets mis. Probeer het opnieuw.");
  }
});
  };

  return (
    <div className="mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Nieuwe Wishlist
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="wishlistName">Naam Wishlist</Label>
            <Input
              id="wishlistName"
              type="text"
              value={wishlistName}
              onChange={(e) => setWishlistName(e.target.value)}
              placeholder="Bijvoorbeeld: Verjaardag 2025"
              required
              className="mt-1 border-2"
            />
          </div>

          <div className="flex items-center w-full justify-between gap-4">
            <div className="w-[49%]">
              <Label>Categorie Achtergronden</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1 border-2">
                  <SelectValue placeholder="Alle categorieën" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[49%]">
              <Label>Wishlist Achtergrond</Label>
              <Select value={backgroundImage} onValueChange={setBackgroundImage}>
                <SelectTrigger className="mt-1 border-2">
                  <SelectValue placeholder="Kies een achtergrond" />
                </SelectTrigger>
                <SelectContent>
                  {filteredImages
                    .filter(img => img.imageLink?.trim())
                    .map(img => (
                      <SelectItem key={img.id} value={img.imageLink}>{img.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#606c38] text-white rounded-md hover:bg-[#4a5526] transition-colors"
            >
              <Plus className="h-5 w-5" />
              Voeg producten toe
            </button>
          )}

          <div className="flex justify-end space-x-3">
            {!showAddForm && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuleer
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-[#606c38] hover:bg-[#4a5526]"
            >
              {isPending ? "Bezig..." : "Maak Wishlist"}
            </Button>
          </div>
        </form>

        {showAddForm && (
          <div className="mb-10 py-10 pt-2">
            <AffiliateProductSearch
              items={items}
              setItems={setItems}
            />
            <div className="w-full flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Sluiten
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}