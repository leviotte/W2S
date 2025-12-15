// src/lib/store/use-auth-store.ts
import { create } from 'zustand';
import type { UserProfile } from '@/types/user';
import type { Wishlist } from '@/types/wishlist';

type ModalType = 'login' | 'register' | 'forgotPassword';

interface AuthState {
  // User State
  currentUser: UserProfile | null;
  isInitialized: boolean;

  // Wishlists (voor compatibility)
  wishlists: Wishlist[];

  // Modal State
  activeModal: ModalType | null;

  // Actions
  setCurrentUser: (user: UserProfile | null) => void;
  setInitialized: (initialized: boolean) => void;
  setWishlists: (wishlists: Wishlist[]) => void;
  
  // Modal Actions
  openModal: (modal: ModalType) => void; // ✅ TOEGEVOEGD
  openLoginModal: () => void;
  openRegisterModal: () => void;
  openForgotPasswordModal: () => void;
  closeModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial State
  currentUser: null,
  isInitialized: false,
  wishlists: [], // ✅ TOEGEVOEGD
  activeModal: null,

  // User Actions
  setCurrentUser: (user) => set({ currentUser: user }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setWishlists: (wishlists) => set({ wishlists }), // ✅ TOEGEVOEGD

  // Modal Actions
  openModal: (modal) => set({ activeModal: modal }), // ✅ TOEGEVOEGD
  openLoginModal: () => set({ activeModal: 'login' }),
  openRegisterModal: () => set({ activeModal: 'register' }),
  openForgotPasswordModal: () => set({ activeModal: 'forgotPassword' }),
  closeModal: () => set({ activeModal: null }),
}));

// Convenience Selectors
export const useCurrentUser = () => useAuthStore((state) => state.currentUser);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.currentUser);
export const useIsAdmin = () => useAuthStore((state) => state.currentUser?.isAdmin === true);