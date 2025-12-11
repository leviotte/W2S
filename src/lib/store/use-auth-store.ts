// src/lib/store/use-auth-store.ts

import { create } from 'zustand';
import type { UserProfile } from '@/types/user';

type ModalType = "login" | "register";

interface AuthState {
  currentUser: UserProfile | null;
  isInitialized: boolean; // Essentieel om te weten of de eerste auth-check is gebeurd!
  activeModal: ModalType | null;
  setCurrentUser: (user: UserProfile | null) => void;
  setInitialized: (initialized: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isInitialized: false, // Start altijd als 'false'
  activeModal: null,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));