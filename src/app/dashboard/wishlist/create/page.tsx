"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";

import { db } from "@/lib/client/firebase";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useRequireAuth } from "@/hooks/useRequireAuth";

import { type Event, eventSchema } from "@/types/event";
import { type WishlistItem } from "@/types/wishlist";
import { type Product } from "@/types/product";

import { AffiliateProductSearchDialog } from "@/components/products/affiliate-product-search-dialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Tijdelijke placeholder types voor achtergronden
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
  
  // Zustand store en authenticatie
  const createWishlist = useAuthStore(state => state.createWishlist);
  const updateEvent = useAuthStore(state => state.updateEvent);
  const currentUser = useRequireAuth(); 

  // Formulier state
  const [wishlistName, setWishlistName] = useState("");
  const [items, setItems] = useState<WishlistItem[]>([]);
  
  // Event-gerelateerde state
  const [eventData, setEventData] = useState<Event | null>(null);
  
  // Achtergrond state
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [backImages, setBackImages] = useState<BackImages[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Query params uit de URL
  const eventId = searchParams.get("event");
  const participantId = searchParams.get("participant");

  // Effect voor het laden van initiële data (achtergronden, categorieën, event info)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categorySnapshot, imageSnapshot] = await Promise.all([
            getDocs(collection(db, "backgroundCategories")),
            getDocs(collection(db, "WishlistBackImages")),
        ]);

        const categoriesData = categorySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Category))
          .filter(i => i.type === "wishlist");
        setCategories(categoriesData);

        const backgroundImages = imageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BackImages[];
        setBackImages(backgroundImages);
        setFilteredImages(backgroundImages);
        
        if (eventId) {
          const eventDoc = await getDoc(doc(db, "events", eventId));
          const validation = eventSchema.safeParse({ id: eventDoc.id, ...eventDoc.data() });
          if (validation.success) {
            setEventData(validation.data);
          } else {
             toast.error("Event niet gevonden.");
             router.push("/dashboard");
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
        toast.error("Kon de benodigde data niet laden.");
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
        fetchData();
    }
  }, [eventId, router, currentUser]);

  // Effect voor het filteren van achtergrondafbeeldingen
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredImages(backImages);
    } else {
      setFilteredImages(backImages.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory, backImages]);

  // Handler voor het toevoegen van een product vanuit de zoek-dialog
  const handleProductSelected = (product: Product) => {
    const newWishlistItem: WishlistItem = {
      id: product.id,
      title: product.title,
      description: product.title,
      image: product.imageUrl,
      url: product.url,
      price: product.price.toString(),
      source: product.source,
    };
    
    if (!items.some(item => item.id === newWishlistItem.id)) {
        setItems(prevItems => [...prevItems, newWishlistItem]);
    } else {
        toast.info("Dit item staat al op je lijst.");
    }
  };

  // Handler voor het verwijderen van een item uit de lijst
  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.warning("Item verwijderd van de lijst.");
  };
  
  // Handler voor het submitten van het formulier
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!wishlistName.trim()) return toast.error("Geef je wishlist een naam.");

    setLoading(true);
    try {
      const newWishlistId = await createWishlist({
        name: wishlistName,
        items: items,
        isPublic: false,
        ownerId: currentUser.id,
        participantIds: [currentUser.id],
        backgroundImage: backgroundImage || "https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media",
      });

      if (!newWishlistId) throw new Error("Kon wishlist niet aanmaken.");
      toast.success(`Wishlist "${wishlistName}" aangemaakt!`);

      if (eventId && eventData && participantId) {
        const updatedParticipants = Object.fromEntries(
            Object.entries(eventData.participants).map(([key, pData]) => 
                pData.id === participantId ? [key, { ...pData, wishlistId: newWishlistId }] : [key, pData]
            )
        );
        
        await updateEvent({ id: eventId, participants: updatedParticipants });
        router.push(`/dashboard/event/${eventId}`);
      } else {
        router.push(`/dashboard/wishlists`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Er is iets misgegaan bij het aanmaken van de wishlist.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || (loading && !eventData && eventId)) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <>
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Nieuwe Wishlist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <Label htmlFor="wishlistName">Naam Wishlist</Label>
                <Input id="wishlistName" type="text" value={wishlistName} onChange={e => setWishlistName(e.target.value)} placeholder="Bv: Verjaardag 2025" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label>Categorie Achtergronden</Label>
                     <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                        <SelectTrigger><SelectValue placeholder="Alle categorieën" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Alle categorieën</SelectItem>
                          {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label>Wishlist Achtergrond</Label>
                     <Select onValueChange={setBackgroundImage} value={backgroundImage}>
                        <SelectTrigger><SelectValue placeholder="Kies een achtergrond" /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="" disabled>Kies een achtergrond</SelectItem>
                           {filteredImages.map(img => <SelectItem key={img.id} value={img.imageLink}>{img.title}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-lg font-medium">Items op je lijst</h3>
                  <div className="space-y-2 rounded-md border p-4">
                      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Je lijst is nog leeg. Voeg producten toe!</p>}
                      {items.map(item => (
                          <div key={item.id} className="flex items-center gap-4 p-2 bg-background rounded-md">
                              <Image src={item.image || '/assets/logos/wish2share.png'} alt={item.title} width={40} height={40} className="w-10 h-10 object-cover rounded"/>
                              <div className="flex-1">
                                  <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                                  {item.price && <p className="text-xs text-muted-foreground">€{item.price}</p>}
                              </div>
                              <Button variant="ghost" size="icon" type="button" onClick={() => removeItem(item.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive"/>
                              </Button>
                          </div>
                      ))}
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsSearchDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Product Toevoegen
                  </Button>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Annuleren</Button>
                <Button type="submit" disabled={loading || !wishlistName.trim()}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Maak Wishlist'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <AffiliateProductSearchDialog
        isOpen={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onProductSelected={handleProductSelected}
      />
    </>
  );
}