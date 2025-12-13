import { create } from 'zustand';

type ModalType = 'login' | 'register' | 'forgotPassword';

interface ModalStore {
  // State
  isOpen: boolean;
  type: ModalType | null;
  returnUrl?: string;

  // Actions
  openLogin: (returnUrl?: string) => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  close: () => void;
  switchToLogin: () => void;
  switchToRegister: () => void;
  switchToForgotPassword: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  // Initial state
  isOpen: false,
  type: null,
  returnUrl: undefined,

  // Actions
  openLogin: (returnUrl) => set({ isOpen: true, type: 'login', returnUrl }),
  openRegister: () => set({ isOpen: true, type: 'register', returnUrl: undefined }),
  openForgotPassword: () => set({ isOpen: true, type: 'forgotPassword', returnUrl: undefined }),
  close: () => set({ isOpen: false, type: null, returnUrl: undefined }),
  switchToLogin: () => set({ type: 'login' }),
  switchToRegister: () => set({ type: 'register' }),
  switchToForgotPassword: () => set({ type: 'forgotPassword' }),
}));