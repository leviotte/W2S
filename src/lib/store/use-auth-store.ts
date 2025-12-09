// src/lib/store/use-auth-store.ts
import { create } from 'zustand';
import type { AuthedUser } from '@/types/user';

// 1. Definieer de interface voor de STATE van de store
// Dit is de data die we globaal op de client willen bijhouden.
// Merk op: GEEN events, wishlists, of profiles hier!
export interface AuthState {
  currentUser: AuthedUser | null;
  isInitialized: boolean;
  isLoading: boolean;
}

// 2. Definieer de interface voor de ACTIONS van de store
// Dit zijn de functies die de state kunnen aanpassen.
// Het zijn simpele, synchrone setters. De async logica verhuist naar Server Actions.
export interface AuthActions {
  setCurrentUser: (user: AuthedUser | null) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// 3. Creëer de store met de initiële state en de implementatie van de actions
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // --- Initiële State ---
  currentUser: null,
  isInitialized: false, // Start op false. Wordt true nadat de eerste sessie-check is gedaan.
  isLoading: true, // Start op true. We gaan ervan uit dat we laden tot isInitialized true is.

  // --- Actions Implementatie ---
  setCurrentUser: (user) => set({ currentUser: user }),

  setInitialized: (initialized) => set({ isInitialized: initialized }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    // De daadwerkelijke server-side logout gebeurt in een Server Action.
    // Deze functie reset enkel de client-side state.
    set({
      currentUser: null,
      isLoading: false,
      isInitialized: true, // We zijn 'geïnitialiseerd' in een uitgelogde staat.
    });
  },
}));