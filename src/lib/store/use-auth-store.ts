// src/lib/store/use-auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { auth, db } from '@/lib/client/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';

// Importeer onze centrale Zod types
import type { UserProfile, SubProfile } from '@/types/user';
import type { Event } from '@/types/event';
import type { Wishlist, CreateWishlistData } from '@/types/wishlist';

// --- Modulaire UI State voor de Modal ---
export type AuthModalView = 'login' | 'register' | 'forgot_password';
type AuthModalState = {
  isOpen: boolean;
  view: AuthModalView;
  open: (view?: AuthModalView) => void;
  close: () => void;
  setView: (view: AuthModalView) => void;
};
export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  view: 'login',
  open: (view = 'login') => set({ isOpen: true, view }),
  close: () => set({ isOpen: false }),
  setView: (view) => set({ view }),
}));


// --- De Volledige AppState Interface ---
interface AppState {
  // State
  currentUser: UserProfile | SubProfile | null;
  profiles: SubProfile[];
  activeProfileId: string | null;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated';
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  events: Event[];
  wishlists: Wishlist[];

  // Actions
  initialize: (user: UserProfile) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Profile Actions
  addSubProfile: (newProfile: SubProfile) => void; // NEW: Voor het updaten van de client state
  addManagerToProfile: (profileId: string, managerId: string) => Promise<void>;
  removeManagerFromProfile: (profileId: string, managerId: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateSubProfile: (profileId: string, data: Partial<SubProfile>) => Promise<void>;
  togglePublicStatus: (isProfile: boolean, profileId?: string) => Promise<void>;
  updateUserPassword: (current: string, newPass: string) => Promise<void>;

  // Data Actions
  loadEvents: () => Promise<void>;
  updateEvent: (eventId: string, data: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  loadWishlists: () => Promise<void>;
  createWishlist: (wishlistData: CreateWishlistData) => Promise<string | null>;
  updateWishlist: (wishlistId: string, data: Partial<Wishlist>) => Promise<void>;
  deleteWishlist: (wishlistId: string) => Promise<void>;
}

export const useAuthStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      currentUser: null,
      profiles: [],
      activeProfileId: null,
      authStatus: 'loading',
      isInitialized: false,
      loading: false,
      error: null,
      events: [],
      wishlists: [],

      // --- CORE ACTIONS ---
      initialize: (user) => {
        if (get().isInitialized || !user) return;
        
        set({
          currentUser: user,
          authStatus: 'authenticated',
          isInitialized: true,
          activeProfileId: user.id,
        });
        
        // Laad data na initialisatie
        get().loadEvents();
        get().loadWishlists();
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) throw new Error("User profile not found.");

          const userProfile: UserProfile = {
            id: userDocSnap.id,
            ...userDocSnap.data(),
          } as UserProfile;

          get().initialize(userProfile);
          useAuthModal.getState().close();
          toast.success(`Welkom terug, ${userProfile.firstName}!`);

        } catch (error) {
          console.error("Login failed:", error);
          const errorMessage = "Incorrect e-mailadres of wachtwoord.";
          set({ authStatus: 'unauthenticated', error: errorMessage });
          toast.error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      register: async (data, password) => {
        set({ loading: true, error: null });
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
            const profileForDb = { ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
            await setDoc(doc(db, "users", userCredential.user.uid), profileForDb);
            await signOut(auth); // Log de gebruiker uit zodat ze moeten inloggen na verificatie
            toast.success("Verificatie-email verzonden! Check je inbox.");
            useAuthModal.getState().setView('login');
            return true;
        } catch (error: any) {
            const msg = error.code === 'auth/email-already-in-use' ? "Dit e-mailadres is al in gebruik." : "Registratie mislukt.";
            set({ error: msg });
            toast.error(msg);
            return false;
        } finally {
          set({ loading: false });
        }
      },
      
      logout: async () => {
        set({ loading: true });
        await signOut(auth);
        set({
          currentUser: null,
          profiles: [],
          activeProfileId: null,
          authStatus: 'unauthenticated',
          isInitialized: false,
          events: [],
          wishlists: [],
          loading: false,
          error: null,
        });
        toast.info("Je bent nu uitgelogd.");
      },

      // --- DATA LOADING ACTIONS ---
      loadEvents: async () => {
        const { currentUser } = get();
        if (!currentUser) {
          set({ events: [] });
          return; // UPDATED: Gebruik een aparte return om de Promise<void> te garanderen
        }
        
        // ... (verdere implementatie) ...
        set({ events: [] }); // Placeholder
      },
      
      loadWishlists: async () => {
        const { currentUser } = get();
        if (!currentUser) {
          set({ wishlists: [] });
          return; // UPDATED: Gebruik een aparte return
        }

        // ... (verdere implementatie) ...
        set({ wishlists: [] }); // Placeholder
      },
      
      // --- PROFILE ACTIONS (Client-side state updates) ---

      // NEW: Actie om een subprofiel toe te voegen aan de client-side state
      addSubProfile: (newProfile) => {
        set((state) => ({
          profiles: [...(state.profiles || []), newProfile],
        }));
      },

      // --- PLACEHOLDER ACTIONS ---
      addManagerToProfile: async (profileId, managerId) => { console.log("addManagerToProfile not implemented"); },
      removeManagerFromProfile: async (profileId, managerId) => { console.log("removeManagerFromProfile not implemented"); },
      updateUserProfile: async (data) => { console.log("updateUserProfile not implemented"); },
      updateSubProfile: async (profileId, data) => { console.log("updateSubProfile not implemented"); },
      togglePublicStatus: async (isProfile, profileId) => { console.log("togglePublicStatus not implemented"); },
      updateUserPassword: async (current, newPass) => { console.log("updateUserPassword not implemented"); },
      updateEvent: async (eventId, data) => { console.log("updateEvent not implemented"); },
      deleteEvent: async (eventId) => { console.log("deleteEvent not implemented"); },
      createWishlist: async (wishlistData) => { console.log("createWishlist not implemented"); return null; },
      updateWishlist: async (wishlistId, data) => { console.log("updateWishlist not implemented"); },
      deleteWishlist: async (wishlistId) => { console.log("deleteWishlist not implemented"); },
    }),
    {
      name: 'wish2share-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist enkel wat strikt noodzakelijk is om de sessie te herstellen
      partialize: (state) => ({ activeProfileId: state.activeProfileId }),
    }
  )
);