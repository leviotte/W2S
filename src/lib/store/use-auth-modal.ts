// src/lib/store/use-auth-modal.ts
import { create } from 'zustand';

type AuthModalView = 'login' | 'register' | 'forgot_password';

interface AuthModalState {
  isOpen: boolean;
  view: AuthModalView;
}

interface AuthModalActions {
  openModal: (view?: AuthModalView) => void;
  closeModal: () => void;
  switchView: (view: AuthModalView) => void;
}

export const useAuthModal = create<AuthModalState & AuthModalActions>((set) => ({
  isOpen: false,
  view: 'login',
  openModal: (view = 'login') => set({ isOpen: true, view }),
  closeModal: () => set({ isOpen: false }),
  switchView: (view) => set({ view }),
}));