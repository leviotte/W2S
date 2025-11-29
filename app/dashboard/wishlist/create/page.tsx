// app/dashboard/wishlist/create/page.tsx
"use client"; // Deze component moet client-side zijn vanwege state en hooks

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import AffiliateProducts from "@/components/AffiliateProductsOnBlog";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useStore } from "@/store/useStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";

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
  source?: string;
}

interface BackImages {
  id: string;
  imageLink: string;
  title: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export default function CreateWishlistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createWishlist, updateEvent } = useStore();
  const user = useRequireAuth();

  const [wishlistName, setWishlistName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<any>();
  const [participant, setParticipant] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [backImages, setBackImages] = useState<BackImages[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Extract query params from URL
  useEffect(() => {
    const eventFromURL = searchParams.get("event");
    const participantFromURL = searchParams.get("participant");
    setEventId(eventFromURL);
    setParticipant(participantFromURL);
  }, [searchParams]);

  // Fetch categories and background images
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categorySnapshot = await getDocs(collection(db, "backgroundCategories"));
        const categoriesData = categorySnapshot.docs
          .map(doc => ({ id: doc.id, name: doc.data().name, type: doc.data().type }))
          .filter(i => i.type === "wishlist");
        setCategories(categoriesData);

        const imageSnapshot = await getDocs(collection(db, "WishlistBackImages"));
        const backgroundImages = imageSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as BackImages[];
        setBackImages(backgroundImages);
        setFilteredImages(backgroundImages);
      } catch (err) {
        console.error("Error fetching categories/images", err);
      }
    };
    fetchData();
  }, []);

  // Filter background images when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredImages(backImages);
    } else {
      const filtered = backImages.filter(img => img.category === selectedCategory);
      setFilteredImages(filtered);
      if (backgroundImage && !filtered.some(img => img.imageLink === backgroundImage)) {
        setBackgroundImage("");
      }
    }
  }, [selectedCategory, backImages, backgroundImage]);

  // Fetch event details if eventId is provided
  useEffect(() => {
    if (!eventId) return;
    const getEvent = async () => {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (!eventDoc.exists()) {
        router.push("/404");
        return;
      }
      setEvent(eventDoc.data());
    };
    getEvent();
  }, [eventId, router]);

  if (!user) return null; // wait for authentication

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wishlistName.trim()) {
      toast.error("Geef je wishlist een naam");
      return;
    }

    if (!items[0]?.title?.trim()) {
      toast.error("Voeg minstens één item toe aan je wishlist.");
      return;
    }

    try {
      const validItems = items
        .filter(item => item.title.trim())
        .map(item => ({
          id: item.id,
          title: item.title,
          image: item.image,
          description: item.description,
          url: item.url,
          price: item.price ? parseFloat(item.price) : undefined,
          source: item.source,
        }));

      const wishlistsDoc = await getDocs(query(collection(db, "wishlists")));
      const wishlistId = await createWishlist({
        name: wishlistName,
        items: validItems,
        isPrivate: false,
        slug: `wishlist${wishlistsDoc.docs.length + 1}`,
        backgroundImage: backgroundImage || "https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media",
      });

      if (eventId && event) {
        const updatedParticipants: Record<string, any> = {};
        Object.keys(event.participants).forEach((key, idx) => {
          const participantData = Object.values(event.participants)[idx];
          updatedParticipants[key] =
            participantData.id === participant ? { ...participantData, wishlistId } : participantData;
        });
        await updateEvent(eventId, { participants: updatedParticipants });
        router.push(`/dashboard/event/${eventId}?tab=events&subTab=details`);
      } else {
        router.push(`/dashboard/${wishlistId}?tab=wishlists&subTab=list`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Er is iets misgegaan bij het aanmaken van de wishlist");
    }
  };

  return (
    <div className="mx-auto xs:px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nieuwe Wishlist</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Naam Wishlist</label>
            <input
              type="text"
              value={wishlistName}
              onChange={e => setWishlistName(e.target.value)}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              placeholder="Bijvoorbeeld: Verjaardag 2025"
              required
            />
          </div>

          <div className="flex items-center w-full justify-between">
            <div className="w-[49%]">
              <label className="block text-sm font-medium text-gray-700">Categorie Achtergronden</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              >
                <option value="">Alle categorieën</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="w-[49%]">
              <label className="block text-sm font-medium text-gray-700">Wishlist Achtergrond</label>
              <select
                value={backgroundImage}
                onChange={e => setBackgroundImage(e.target.value)}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              >
                <option value="" disabled>Kies een achtergrond</option>
                {filteredImages.map(img => (
                  <option key={img.id} value={img.imageLink}>{img.title}</option>
                ))}
              </select>
            </div>
          </div>

          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full max-w-lg mx-auto flex justify-center items-center gap-2 text-gray-700 py-2 border rounded-md hover:bg-gray-50"
            >
              <Plus className="h-5 w-5" /> Voeg producten toe
            </button>
          )}

          <div className="flex justify-end space-x-3">
            {!showAddForm && (
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuleer
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive"
            >
              Maak Wishlist
            </button>
          </div>
        </form>

        {showAddForm && (
          <div className="mb-10 py-10 pt-2">
            <AffiliateProducts items={items} setItems={setItems} event={event} />
            <div className="w-full flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
