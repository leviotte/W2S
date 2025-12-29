// src/app/dashboard/wishlists/create/[eventId]/[participantId]/page.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/client/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { type WishlistItem } from "@/types/wishlist";
import { createWishlistAction } from "@/lib/server/actions/wishlist";

import AffiliateProductSearch from "@/components/products/AffiliateProductSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/lib/store/use-auth-store";

interface BackImage { id: string; imageLink: string; title: string; category: string; }
interface Category { id: string; name: string; type: string; }

export default function CreateWishlistPage() {
  const router = useRouter();
  useRequireAuth();
  const currentUser = useCurrentUser();

  // ✅ Top-level params
  const params = useParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  const participantId = Array.isArray(params.participantId) ? params.participantId[0] : params.participantId;

  // ✅ State
  const [wishlistName, setWishlistName] = useState("");
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [backImages, setBackImages] = useState<BackImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ✅ Fetch categories & backgrounds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categorySnap, imageSnap] = await Promise.all([
          getDocs(collection(db, "backgroundCategories")),
          getDocs(collection(db, "WishlistBackImages")),
        ]);

        const categoriesData = categorySnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Category))
          .filter(c => c.type === "wishlist");
        setCategories(categoriesData);

        const imagesData = imageSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackImage));
        setBackImages(imagesData);
        setFilteredImages(imagesData);
      } catch (err) {
        console.error("Fout bij laden achtergronddata:", err);
        toast.error("Kon achtergronden niet laden");
      }
    };
    fetchData();
  }, []);

  // ✅ Filter images bij categorie-change
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredImages(backImages);
    } else {
      setFilteredImages(backImages.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory, backImages]);

  // ✅ Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wishlistName.trim()) return toast.error("Geef je wishlist een naam");
    if (items.length === 0) return toast.error("Voeg minstens één item toe aan je wishlist.");
    if (!currentUser?.id) return toast.error("Je moet ingelogd zijn om een wishlist aan te maken.");

    startTransition(async () => {
      try {
        const result = await createWishlistAction({
          userId: currentUser.id,
          data: {
            name: wishlistName.trim(),
            backgroundImage: backgroundImage || "...standaard-url...",
            items,
            eventId: eventId || undefined,
            participantId: participantId || undefined,
          },
        });

        if (result.success) {
          toast.success("Wishlist succesvol aangemaakt! 🎉");
          router.push('/dashboard/wishlists');
        } else {
          toast.error(result.message || "Er ging iets mis bij het aanmaken van de wishlist");
        }
      } catch (err) {
        console.error("Submit error:", err);
        toast.error("Er ging iets mis. Probeer het opnieuw.");
      }
    });
  };

  return (
    <div className="mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nieuwe Wishlist</h1>

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
                  {filteredImages.filter(img => img.imageLink?.trim()).map(img => (
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
              <Plus className="h-5 w-5" /> Voeg producten toe
            </button>
          )}

          <div className="flex justify-end space-x-3">
            {!showAddForm && (
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuleer
              </Button>
            )}
            <Button type="submit" disabled={isPending} className="bg-[#606c38] hover:bg-[#4a5526]">
              {isPending ? "Bezig..." : "Maak Wishlist"}
            </Button>
          </div>
        </form>

        {showAddForm && (
          <div className="mb-10 py-10 pt-2">
            <AffiliateProductSearch items={items} setItems={setItems} />
            <div className="w-full flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Sluiten
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
