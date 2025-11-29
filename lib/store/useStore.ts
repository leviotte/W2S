// app/store/useStore.ts
import { create } from "zustand";
import { createAuthSlice, AuthSlice } from "./slices/authSlice";
import { createEventSlice, EventSlice } from "./slices/eventSlice";
import { createWishlistSlice, WishlistSlice } from "./slices/wishlistSlice";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatarURL?: string | null;
  mainAccount?: boolean;
  managers?: { id: string }[];
}

type Store = AuthSlice &
  EventSlice &
  WishlistSlice & {
    profiles: UserProfile[];
    setProfiles: (profiles: UserProfile[]) => void;
    subscribeToProfiles: (userId: string, user: UserProfile | null) => () => void;
  };

export const useStore = create<Store>()((...args) => ({
  ...createAuthSlice(...args),
  ...createEventSlice(...args),
  ...createWishlistSlice(...args),

  profiles: [],
  setProfiles: (profiles: UserProfile[]) => {
    const set = args[0];
    set({ profiles });
  },

  subscribeToProfiles: (userId: string, user: UserProfile | null) => {
    const set = useStore.getState().setProfiles;

    if (!userId) return () => {};

    const profilesQuery = query(collection(db, "profiles"));

    const unsubscribe = onSnapshot(profilesQuery, (querySnapshot) => {
      const userProfiles: UserProfile[] = querySnapshot.docs
        .map((doc) => doc.data() as UserProfile)
        .filter(
          (profile) =>
            profile.userId === userId ||
            profile.managers?.some((manager) => manager.id === userId)
        );

      const mainAccountProfile: UserProfile = {
        id: "main-account",
        name: user?.firstName || user?.name || "Main Account",
        avatarURL: user?.avatarURL || user?.photoURL || null,
        mainAccount: true,
      };

      set([mainAccountProfile, ...userProfiles]);
    });

    return unsubscribe;
  },
}));
