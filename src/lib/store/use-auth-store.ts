// src/lib/store/use-auth-store.ts
import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types/user';

interface AuthState {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isInitialized: boolean; // Is de eerste check (onAuthStateChanged) gebeurd?
  loading: boolean;
  
  // Methoden om de state te updaten
  setCurrentUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // --- STATE ---
  currentUser: null,
  userProfile: null,
  isInitialized: false,
  loading: true, // Start in loading state tot de eerste auth check is gedaan

  // --- ACTIONS ---
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
  setUserProfile: (profile) => {
    // Wanneer het profiel wordt gezet, is de initialisatie per definitie compleet
    set({ userProfile: profile, loading: false, isInitialized: true });
  },
  setInitialized: (isInitialized) => {
    set({ isInitialized });
  },
  setLoading: (loading) => {
    set({ loading });
  },
}));