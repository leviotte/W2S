import { create } from 'zustand';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import type { UserProfile } from '@/types/user';
import type { Event } from '@/types/event';
import type { Wishlist } from '@/types/wishlist';

// --- TYPE DEFINITIES ---

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type AuthModalView = 'login' | 'register' | 'forgot_password';
export const MAIN_ACCOUNT_PROFILE_ID = 'main-account';

// De volledige state van onze applicatie
interface AuthState {
  // Auth & User State
  currentUser: UserProfile | null;
  authStatus: AuthStatus;
  
  // Profile Switching State
  profiles: UserProfile[];
  activeProfileId: string; // Kan niet null zijn, is altijd minstens 'main-account'
  
  // Data State
  events: Event[];
  wishlists: Wishlist[];
  
  // UI State
  isModalOpen: boolean;
  modalView: AuthModalView;
  
  // Loading states
  loading: boolean; // Algemene loading state
}

// Alle acties die de state kunnen aanpassen
interface AuthActions {
  // Auth & User Actions
  setUser: (user: UserProfile | null) => void;

  // Modal Actions
  openModal: (view?: AuthModalView) => void;
  closeModal: () => void;
  switchView: (view: AuthModalView) => void;
  
  // Profile Actions
  setProfiles: (profiles: UserProfile[]) => void;
  setActiveProfileId: (profileId: string) => void;
  getActiveProfile: () => UserProfile | null;

  // Data Actions (Async)
  loadEvents: (userId: string) => Promise<void>;
  updateEvent: (eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  loadWishlists: (userId: string) => Promise<void>;
  createWishlist: (wishlistData: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
  updateWishlist: (wishlistData: Partial<Wishlist>) => Promise<void>;
  deleteWishlist: (wishlistId: string) => Promise<void>;

  addManagerToProfile: (profileId: string, managerId: string) => Promise<void>;
  removeManagerFromProfile: (profileId: string, managerId: string) => Promise<void>;
}

// --- DE STORE ---

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // --- INITIAL STATE ---
  currentUser: null,
  authStatus: 'loading',
  profiles: [],
  activeProfileId: MAIN_ACCOUNT_PROFILE_ID,
  events: [],
  wishlists: [],
  isModalOpen: false,
  modalView: 'login',
  loading: true,

  // --- ACTIONS ---

  // Auth & User Actions
  setUser: (user) => {
    set({ 
      currentUser: user, 
      authStatus: user ? 'authenticated' : 'unauthenticated',
      loading: false,
     });
     if (user) {
        // Laad direct de data voor de ingelogde gebruiker
        get().loadEvents(user.id);
        get().loadWishlists(user.id);
     } else {
        // Reset data bij uitloggen
        set({ events: [], wishlists: [] });
     }
  },

  // Modal Actions
  openModal: (view = 'login') => set({ isModalOpen: true, view }),
  closeModal: () => set({ isModalOpen: false }),
  switchView: (view) => set({ view }),
  
  // Profile Actions
  setProfiles: (profiles) => set({ profiles }),
  setActiveProfileId: (profileId) => {
    localStorage.setItem('activeProfileId', profileId);
    set({ activeProfileId: profileId });
  },
  getActiveProfile: () => {
    const { profiles, activeProfileId, currentUser } = get();
    if (activeProfileId === MAIN_ACCOUNT_PROFILE_ID) {
      return currentUser;
    }
    return profiles.find(p => p.id === activeProfileId) || null;
  },
  
  // --- ASYNC DATA ACTIONS ---

  // Events
  loadEvents: async (userId) => {
    set({ loading: true });
    const q = query(collection(db, 'events'), where('participantIds', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    set({ events, loading: false });
  },
  updateEvent: async (eventData) => {
    if (!eventData.id) return;
    const eventRef = doc(db, 'events', eventData.id);
    await updateDoc(eventRef, eventData);
    set(state => ({
      events: state.events.map(e => e.id === eventData.id ? { ...e, ...eventData } : e)
    }));
  },
  deleteEvent: async (eventId) => {
    await deleteDoc(doc(db, 'events', eventId));
    set(state => ({
      events: state.events.filter(e => e.id !== eventId)
    }));
  },

  // Wishlists
  loadWishlists: async (userId) => {
    set({ loading: true });
    const q = query(collection(db, 'wishlists'), where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    const wishlists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wishlist));
    set({ wishlists, loading: false });
  },
  createWishlist: async (wishlistData) => {
    const newWishlistRef = await addDoc(collection(db, 'wishlists'), {
      ...wishlistData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const newWishlist = { id: newWishlistRef.id, ...wishlistData } as Wishlist;
    set(state => ({ wishlists: [...state.wishlists, newWishlist] }));
    return newWishlistRef.id;
  },
  updateWishlist: async (wishlistData) => {
    if (!wishlistData.id) return;
    const wishlistRef = doc(db, 'wishlists', wishlistData.id);
    await updateDoc(wishlistRef, wishlistData);
    set(state => ({
      wishlists: state.wishlists.map(w => w.id === wishlistData.id ? { ...w, ...wishlistData } : w)
    }));
  },
  deleteWishlist: async (wishlistId) => {
    await deleteDoc(doc(db, 'wishlists', wishlistId));
    set(state => ({
      wishlists: state.wishlists.filter(w => w.id !== wishlistId)
    }));
  },

  // Managers
  addManagerToProfile: async (profileId, managerId) => {
    const profileRef = doc(db, 'users', profileId);
    await updateDoc(profileRef, { managers: arrayUnion(managerId) });
    set(state => ({
        profiles: state.profiles.map(p => p.id === profileId ? {...p, managers: [...p.managers, managerId] } : p)
    }));
  },
  removeManagerFromProfile: async (profileId, managerId) => {
    const profileRef = doc(db, 'users', profileId);
    await updateDoc(profileRef, { managers: arrayRemove(managerId) });
     set(state => ({
        profiles: state.profiles.map(p => p.id === profileId ? {...p, managers: p.managers.filter(id => id !== managerId) } : p)
    }));
  }
}));