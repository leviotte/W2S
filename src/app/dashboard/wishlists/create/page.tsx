// src/app/dashboard/wishlists/create/page.tsx

"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/client/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { type WishlistItem } from "@/types/wishlist";
import { type Product } from "@/types/product";
import { productToWishlistItem } from "@/lib/utils/product-helpers";

import { createWishlistAction, type CreateWishlistFormState } from './actions';
import { SubmitButton } from "@/components/ui/submit-button";
import { AffiliateProductSearchDialog } from "@/components/products/affiliate-product-search-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageTitle from "@/components/layout/page-title";

interface BackImage { id: string; imageLink: string; title: string; category: string; }
interface Category { id: string; name: string; type: string; }

export default function CreateWishlistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useRequireAuth();

  const eventId = searchParams.get("event");
  const participantId = searchParams.get("participant");

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [backImages, setBackImages] = useState<BackImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  
  const initialState: CreateWishlistFormState = { success: false, message: '', errors: {} };
  const [formState, formAction] = useActionState(createWishlistAction, initialState);

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
        toast.error("Kon achtergronddata niet laden."); 
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formState.message && !formState.success) {
      toast.error("Fout bij aanmaken", { description: formState.message });
    }
  }, [formState]);
  
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredImages(backImages);
    } else {
      setFilteredImages(backImages.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory, backImages]);

  const handleProductSelected = (product: Product) => {
    const newWishlistItem: WishlistItem = productToWishlistItem(product);

    if (!items.some(item => item.id === newWishlistItem.id)) {
      setItems(prevItems => [...prevItems, newWishlistItem]);
      toast.success(`${product.title} toegevoegd!`);
    } else { 
      toast.info("Dit item staat al op je lijst."); 
    }
    setIsSearchDialogOpen(false);
  };

  const removeItem = (itemIdToRemove: string) => {
    setItems(prev => prev.filter(item => String(item.id) !== itemIdToRemove));
    toast.warning("Item verwijderd.");
  };

  return (
    <>
      <div className="container mx-auto max-w-4xl py-8">
        <PageTitle 
          title="Nieuwe Wishlist Maken" 
          description={eventId ? "Voor een event" : "Stel je perfecte verlanglijst samen."} 
        />
        
        <form action={formAction} className="space-y-8 mt-8">
          <Card>
            <CardHeader><CardTitle>Basisgegevens</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="wishlistName">Naam Wishlist</Label>
                <Input id="wishlistName" name="wishlistName" placeholder="Bv: Verjaardag 2025" required />
                {formState.errors?.wishlistName && (
                  <p className="text-sm text-destructive mt-1">{formState.errors.wishlistName[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Categorie Achtergronden</Label>
                  <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                    <SelectTrigger><SelectValue placeholder="Alle categorieën" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle categorieën</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Wishlist Achtergrond</Label>
                  {/* FIX: Lege defaultValue is correct, maar de SelectItem met lege value is verwijderd. */}
                  <Select name="backgroundImage" defaultValue="">
                    <SelectTrigger><SelectValue placeholder="Kies een achtergrond" /></SelectTrigger>
                    <SelectContent>
                      {/* De placeholder wordt nu automatisch getoond. */}
                      {filteredImages
                        .filter(img => img.imageLink && img.imageLink.trim() !== "")
                        .map(img => (
                          <SelectItem key={img.id} value={img.imageLink}>{img.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formState.errors?.backgroundImage && (
                    <p className="text-sm text-destructive mt-1">{formState.errors.backgroundImage[0]}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Items op je Lijst</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-md border p-4 min-h-[100px]">
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Je lijst is nog leeg.</p>
                )}
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-2 bg-background rounded-md">
                    <Image 
                      src={item.imageUrl || '/default-avatar.png'} 
                      alt={item.title} 
                      width={40} 
                      height={40} 
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      type="button" 
                      onClick={() => removeItem(String(item.id))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  </div>
                ))}
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsSearchDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Product Toevoegen
              </Button>
              {formState.errors?.items && (
                <p className="text-sm text-destructive mt-1">{formState.errors.items[0]}</p>
              )}
            </CardContent>
          </Card>

          <input type="hidden" name="items" value={JSON.stringify(items)} />
          {eventId && <input type="hidden" name="eventId" value={eventId} />}
          {participantId && <input type="hidden" name="participantId" value={participantId} />}

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Annuleren
            </Button>
            <SubmitButton />
          </div>
        </form>
      </div>

      <AffiliateProductSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onProductSelect={handleProductSelected}
      />
    </>
  );
}