"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/client/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { Gift, Edit2, Save, Trash2, Plus, X, Image } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { AffiliateProducts } from "../AffiliateProducts";
import { useStore } from "@/lib/store/useStore";

interface WishlistItem {
  id: string;
  title: string;
  image?: string;
  description: string;
  url?: string;
  price?: string;
  purchasedBy: Record<string, string[]>;
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

interface Wishlist {
  id: string;
  name: string;
  owner: string;
  items: WishlistItem[];
  backgroundImage?: string;
}

export default function WishlistEventPage({
  params,
}: {
  params: { id: string; eventId: string };
}) {
  const { id, eventId } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const maxPrice = searchParams.get("maxPrice");

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
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
    purchasedBy: {},
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);

  const { currentUser } = useStore();
  const activeProfileId = localStorage.getItem("activeProfile");
  const account =
    activeProfileId === "main-account" ? currentUser?.id : activeProfileId;

  // ============================
  // Fetch Wishlist Realtime
  // ============================
  useEffect(() => {
    if (!id) return;
    let unsubscribe: (() => void) | null = null;

    const getSlug = async (ownerId: any) => {
      const userQuery = query(collection(db, "users"), where("id", "==", ownerId));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) return userSnap.docs[0].data()?.slug;

      const profileQuery = query(
        collection(db, "profiles"),
        where("id", "==", ownerId)
      );
      const profileSnap = await getDocs(profileQuery);
      if (!profileSnap.empty) return profileSnap.docs[0].data()?.slug;

      console.warn("Owner not found in users or profiles");
      return null;
    };

    const initRealtimeWishlist = async () => {
      try {
        const wishlistQuery = query(collection(db, "wishlists"), where("slug", "==", id));
        const snapshot = await getDocs(wishlistQuery);
        if (snapshot.empty) {
          setLoading(false);
          return;
        }

        const wishlistDoc = snapshot.docs[0];
        const wishlistId = wishlistDoc.id;

        unsubscribe = onSnapshot(doc(db, "wishlists", wishlistId), async (docSnap) => {
          if (!docSnap.exists()) return;

          const wishlistData = { id: docSnap.id, ...docSnap.data() } as Wishlist;
          setWishlist(wishlistData);
          setBackgroundImage(wishlistData.backgroundImage || "");

          const slug = await getSlug(wishlistData.owner);
          if (!slug) return;

          const userQuery = query(collection(db, "users"), where("slug", "==", slug));
          const userSnap = await getDocs(userQuery);
          if (!userSnap.empty) setOwner(userSnap.docs[0].data());
          else {
            const profileQuery = query(
              collection(db, "profiles"),
              where("slug", "==", slug)
            );
            const profileSnap = await getDocs(profileQuery);
            if (!profileSnap.empty) setOwner(profileSnap.docs[0].data());
          }
        });
      } catch (err) {
        console.error(err);
        toast.error("Ophalen wishlist mislukt");
      } finally {
        setLoading(false);
      }
    };

    initRealtimeWishlist();
    return () => unsubscribe && unsubscribe();
  }, [id]);

  // ============================
  // Backgrounds
  // ============================
  useEffect(() => {
    if (showBackgroundModal) fetchBackgroundData();
  }, [showBackgroundModal]);

  const fetchBackgroundData = async () => {
    setIsLoadingBackgrounds(true);
    try {
      const categoriesSnap = await getDocs(collection(db, "backgroundCategories"));
      const allCategories = categoriesSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        type: doc.data().type,
      }));
      setCategories(allCategories.filter((c) => c.type === "wishlist"));

      const imagesSnap = await getDocs(collection(db, "WishlistBackImages"));
      setBackgroundImages(
        imagesSnap.docs.map((doc) => ({
          id: doc.id,
          imageLink: doc.data().imageLink,
          title: doc.data().title,
          category: doc.data().category,
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Loading backgrounds failed");
    } finally {
      setIsLoadingBackgrounds(false);
    }
  };

  const getFilteredImages = () =>
    selectedCategory
      ? backgroundImages.filter((img) => img.category === selectedCategory)
      : backgroundImages;

  const handleSaveBackground = async () => {
    if (!backgroundImage || !wishlist) return;
    try {
      await updateDoc(doc(db, "wishlists", wishlist.id), {
        backgroundImage,
      });
      setWishlist({ ...wishlist, backgroundImage });
      setShowBackgroundModal(false);
      toast.success("Achtergrond bijgewerkt");
    } catch (err) {
      console.error(err);
      toast.error("Bijwerken mislukt");
    }
  };

  // ============================
  // Item Actions
  // ============================
  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item.id);
    setEditedItem(item);
  };

  const handleSaveItem = async (itemId: string) => {
    if (!wishlist) return;
    try {
      const updatedItems = wishlist.items.map((item) =>
        item.id === itemId ? editedItem : item
      );
      await updateDoc(doc(db, "wishlists", wishlist.id), { items: updatedItems });
      setWishlist({ ...wishlist, items: updatedItems });
      setEditingItem(null);
      toast.success("Item updated");
    } catch (err) {
      toast.error("Bijwerken mislukt");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!wishlist || !window.confirm("Weet je zeker?")) return;
    try {
      const updatedItems = wishlist.items.filter((i) => i.id !== itemId);
      await updateDoc(doc(db, "wishlists", wishlist.id), { items: updatedItems });
      setWishlist({ ...wishlist, items: updatedItems });
      toast.success("Item verwijderd");
    } catch (err) {
      toast.error("Verwijderen mislukt");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!wishlist) return <p>Wishlist niet gevonden</p>;

  const isMain = activeProfileId === "main-account";
  const isOwner = isMain
    ? currentUser?.id === wishlist.owner
    : activeProfileId === wishlist.owner;

  return (
    <div>
      <div
        style={{
          backgroundImage: `url(${wishlist.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="w-full fixed h-[100vh] top-0 z-[-1]"
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg shadow-sm backdrop-blur-sm bg-white/40 p-6">
          <div className="flex items-center space-x-4">
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
              <h1 className="text-2xl font-bold">{wishlist.name}</h1>
              {owner && (
                <p className="text-gray-600">
                  Wishlist van {owner.name || `${owner.firstName} ${owner.lastName}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
