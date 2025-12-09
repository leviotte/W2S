// src/lib/store/use-modal-store.ts
import { create } from 'zustand';

export type AuthModalView = 'login' | 'register' | 'forgot_password';

interface AuthModalState {
  isOpen: boolean;
  view: AuthModalView;
  open: (view?: AuthModalView) => void;
  close: () => void;
  setView: (view: AuthModalView) => void;
}

// MENTOR-NOTITIE: We hernoemen het naar useAuthModal voor de duidelijkheid.
export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  view: 'login',
  open: (view = 'login') => set({ isOpen: true, view }),
  close: () => set({ isOpen: false }),
  setView: (view) => set({ view }),
}));