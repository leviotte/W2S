// src/app/state/wishlist/wishlistSlice.ts
// Next.js 16 + Server Components ready, fully typed, Firestore modular

"use client";
import { create } from "zustand";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { toast } from "sonner";

export interface Wishlist {
  id: string;
  name: string;
  userId: string;
  profileId: string | null;
  owner: string;
  items: any[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WishlistState {
  wishlists: Wishlist[];
  loadWishlists: () => Promise<void>;
  createWishlist: (data: Partial<Wishlist>) => Promise<string>;
  updateWishlist: (id: string, data: Partial<Wishlist>) => Promise<void>;
  deleteWishlist: (id: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlists: [],

  loadWishlists: async () => {
    try {
      const activeProfileId = typeof window !== "undefined"
        ? localStorage.getItem("activeProfile")
        : null;
      const { authUser } = get() as any;
      if (!authUser) return;

      const wishRef = collection(db, "wishlists");
      const q = activeProfileId && activeProfileId !== "main-account"
        ? query(wishRef, where("profileId", "==", activeProfileId))
        : query(wishRef, where("userId", "==", authUser.id), where("profileId", "==", null));

      const snap = await getDocs(q);
      const wishlists = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Wishlist[];
      set({ wishlists });
    } catch (err) {
      console.error("Wishlist load error", err);
      toast.error("Couldn't load wishlists");
    }
  },

  createWishlist: async (data) => {
    try {
      const { authUser } = get() as any;
      if (!authUser) throw new Error("Login required");

      if (!data.name?.trim()) throw new Error("Wishlist needs a name");

      const activeProfileId = typeof window !== "undefined"
        ? localStorage.getItem("activeProfile")
        : null;
      const id = crypto.randomUUID();
      const isProfile = activeProfileId && activeProfileId !== "main-account";

      const payload: Wishlist = {
        id,
        name: data.name!,
        userId: authUser.id,
        profileId: isProfile ? activeProfileId : null,
        owner: isProfile ? activeProfileId! : authUser.id,
        items: data.items || [],
        isPrivate: data.isPrivate || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "wishlists", id), payload);
      await get().loadWishlists();
      toast.success("Wishlist created");
      return id;
    } catch (err: any) {
      console.error("Wishlist create error", err);
      toast.error(err.message || "Error creating wishlist");
      throw err;
    }
  },

  updateWishlist: async (id, data) => {
    try {
      await updateDoc(doc(db, "wishlists", id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });

      await get().loadWishlists();
      toast.success("Wishlist updated");
    } catch (err) {
      console.error("Wishlist update error", err);
      toast.error("Couldn't update wishlist");
      throw err;
    }
  },

  deleteWishlist: async (id) => {
    try {
      await deleteDoc(doc(db, "wishlists", id));
      await get().loadWishlists();
      toast.success("Wishlist deleted");
    } catch (err) {
      console.error("Wishlist delete error", err);
      toast.error("Couldn't delete wishlist");
      throw err;
    }
  },
}));
