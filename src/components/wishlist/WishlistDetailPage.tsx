"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { Gift, Edit2, Save, Trash2, Plus, X, Image } from "lucide-react";
import { toast } from "react-toastify";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AffiliateProductSearchDialog } from "@/components/products/affiliate-product-search-dialog";

interface WishlistItem {
  id: string;
  title: string;
  image?: string;
  description: string;
  url?: string;
  price?: string;
}

interface BackgroundImage {
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

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const maxPrice = searchParams.get("maxPrice");

  const [wishlist, setWishlist] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<WishlistItem>({
    id: "",
    title: "",
    description: "",
    image: "",
    url: "",
    price: undefined,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(0);

  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("auth-store") || "null");
  const activeProfileId = localStorage.getItem("activeProfile");
  const isMain = activeProfileId === "main-account";

  const isOwner = isMain
    ? user && user?.state?.currentUser?.id === wishlist?.owner
    : activeProfileId === wishlist?.owner;

  // --- Fetch Wishlist + Owner ---
  useEffect(() => {
    if (!id) return;

    const getSlug = async (ownerId: any) => {
      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("id", "==", ownerId))
      );
      if (!usersSnapshot.empty) return usersSnapshot.docs[0].data().slug;

      const profilesSnapshot = await getDocs(
        query(collection(db, "profiles"), where("id", "==", ownerId))
      );
      if (!profilesSnapshot.empty) return profilesSnapshot.docs[0].data().slug;

      console.warn("Owner not found");
      return null;
    };

    const fetchWishlist = async () => {
      try {
        const wishlistQuery = query(
          collection(db, "wishlists"),
          where("slug", "==", id)
        );
        const wishlistSnapshot = await getDocs(wishlistQuery);
        if (wishlistSnapshot.empty) {
          toast.error("Wishlist niet gevonden");
          setLoading(false);
          return;
        }

        const wishlistData = { id: wishlistSnapshot.docs[0].id, ...wishlistSnapshot.docs[0].data() };
        setWishlist(wishlistData);
        setBackgroundImage(wishlistData.backgroundImage || "");

        const slug = await getSlug(wishlistData.owner);
        if (!slug) return;

        const userQuery = query(collection(db, "users"), where("slug", "==", slug));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          setOwner(userSnapshot.docs[0].data());
        } else {
          const profileQuery = query(collection(db, "profiles"), where("slug", "==", slug));
          const profileSnapshot = await getDocs(profileQuery);
          if (!profileSnapshot.empty) setOwner(profileSnapshot.docs[0].data());
        }
      } catch (err) {
        console.error(err);
        toast.error("Ophalen van wishlist mislukt");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [id]);

  useEffect(() => {
    if (maxPrice) setMaxPriceFilter(Number(maxPrice));
  }, [maxPrice]);

  // --- Background modal ---
  useEffect(() => {
    if (!showBackgroundModal) return;
    const fetchBackgroundData = async () => {
      setIsLoadingBackgrounds(true);
      try {
        const categoriesSnapshot = await getDocs(collection(db, "backgroundCategories"));
        const allCategories = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          type: doc.data().type,
        }));
        setCategories(allCategories.filter((c) => c.type === "wishlist"));

        const imagesSnapshot = await getDocs(collection(db, "WishlistBackImages"));
        setBackgroundImages(
          imagesSnapshot.docs.map((doc) => ({
            id: doc.id,
            imageLink: doc.data().imageLink,
            title: doc.data().title,
            category: doc.data().category,
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load backgrounds");
      } finally {
        setIsLoadingBackgrounds(false);
      }
    };
    fetchBackgroundData();
  }, [showBackgroundModal]);

  const getFilteredImages = () =>
    selectedCategory
      ? backgroundImages.filter((img) => img.category === selectedCategory)
      : backgroundImages;

  const handleSaveBackground = async () => {
    if (!backgroundImage) return toast.warning("Selecteer een achtergrond");
    try {
      await updateDoc(doc(db, "wishlists", wishlist.id), { backgroundImage });
      setWishlist({ ...wishlist, backgroundImage });
      setShowBackgroundModal(false);
      toast.success("Achtergrond bijgewerkt");
    } catch (err) {
      console.error(err);
      toast.error("Bijwerken mislukt");
    }
  };

  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item.id);
    setEditedItem(item);
  };

  const handleSaveItem = async (itemId: string) => {
    const updatedItems = wishlist.items.map((item: WishlistItem) =>
      item.id === itemId ? editedItem : item
    );
    try {
      await updateDoc(doc(db, "wishlists", wishlist.id), { items: updatedItems });
      setWishlist({ ...wishlist, items: updatedItems });
      setEditingItem(null);
      toast.success("Item bijgewerkt");
    } catch (err) {
      console.error(err);
      toast.error("Bijwerken mislukt");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const updatedItems = wishlist.items.filter((item: WishlistItem) => String(item.id || item.id) !== String(itemId));
    try {
      await updateDoc(doc(db, "wishlists", wishlist.id), { items: updatedItems });
      setWishlist({ ...wishlist, items: updatedItems });
      toast.success("Item verwijderd");
    } catch (err) {
      console.error(err);
      toast.error("Verwijderen mislukt");
    } finally {
      setIsAlertOpen(false);
    }
  };

  const addItemToWishlist = async (product: any) => {
    const primaryPlatform = product.platforms
      ? Object.values(product.platforms)[0]
      : { URL: product.URL, Price: product.Price, Source: product.Source };

    const newItem = {
      title: product.Title || product.Name,
      image: product.ImageURL ?? "",
      description: "",
      url: primaryPlatform.URL ?? product.URL ?? "",
      price: primaryPlatform.Price ?? product.Price ?? "",
      id: product.ID || product.id,
      source: primaryPlatform.Source ?? product.Source,
      platforms: product.platforms,
    };
    const updatedItems = [...(wishlist.items || []), newItem];

    try {
      await updateDoc(doc(db, "wishlists", wishlist.id), { items: updatedItems });
      setWishlist({ ...wishlist, items: updatedItems });
      toast.success("Item toegevoegd");
    } catch (err) {
      console.error(err);
      toast.error("Toevoegen mislukt");
    }
  };

  if (loading) return <p className="text-center py-12">Loading...</p>;
  if (!wishlist) return <p className="text-center py-12">Wishlist niet gevonden</p>;

  return (
    <div>
      {/* Background */}
      <div
        style={{
          backgroundImage: `url(${wishlist.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="w-full fixed min-h-screen top-0 z-[-1]"
      />

      {/* Wishlist content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg shadow-sm bg-white/40 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {owner && (
              <UserAvatar
                firstName={owner.firstName || null}
                lastName={owner.lastName || null}
                photoURL={owner.photoURL || owner.avatarURL}
                name={owner.name || `${owner.firstName} ${owner.lastName}`}
                size="lg"
              />
            )}
            <div className="flex-grow">
              <h1 className="text-xl sm:text-2xl font-bold">{wishlist.name}</h1>
              {owner && <p className="text-gray-600">Wishlist van {owner.name || `${owner.firstName} ${owner.lastName}`}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 mt-2 sm:mt-0">
              {isOwner && (
                <button onClick={() => setShowBackgroundModal(true)} className="hover:bg-white/40 border border-black px-3 py-2 rounded-md flex items-center">
                  <Image className="h-5 w-5 mr-2" /> Bewerk Achtergrond
                </button>
              )}
            </div>
          </div>

          {/* Wishlist items */}
          <div className="mt-4 space-y-4">
            {wishlist.items?.length === 0 && <p className="text-center text-gray-500">Deze wishlist is nog leeg.</p>}
            {wishlist.items?.map((item: WishlistItem) => (
              <div key={item.id} className="p-3 bg-white/60 rounded-md flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-md" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-300 flex items-center justify-center text-gray-500 rounded-md">Geen Afbeelding</div>
                  )}
                  <div>
                    <h3 className="text-sm sm:text-md">{item.title}</h3>
                    {item.description && <p className="text-gray-600 text-xs">{item.description}</p>}
                    {item.price && <p className="text-gray-600 text-xs">€{item.price}</p>}
                  </div>
                </div>
                {isOwner ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleEditItem(item)}><Edit2 /></button>
                    <button onClick={() => setIsAlertOpen(true)} className="text-red-600"><Trash2 /></button>
                  </div>
                ) : (
                  <a href={item.url} target="_blank" className="bg-warm-olive text-white px-3 py-2 rounded-md flex items-center">
                    <Gift className="h-4 w-4 mr-1" /> Koop dit cadeau
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
