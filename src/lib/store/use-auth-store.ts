// src/lib/store/use-auth-store.ts
import { create } from 'zustand';
import type { UserProfile } from '@/types/user';

// --- State & Actions voor de AUTH MODAL ---

interface AuthModalState {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  closeModals: () => void;
  switchToRegister: () => void;
  switchToLogin: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isLoginOpen: false,
  isRegisterOpen: false,
  openLogin: () => set({ isLoginOpen: true, isRegisterOpen: false }),
  openRegister: () => set({ isRegisterOpen: true, isLoginOpen: false }),
  closeModals: () => set({ isLoginOpen: false, isRegisterOpen: false }),
  switchToRegister: () => set({ isLoginOpen: false, isRegisterOpen: true }),
  switchToLogin: () => set({ isLoginOpen: true, isRegisterOpen: false }),
}));

// --- State & Actions voor de AUTH SESSIE ZELF ---

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthSessionState {
  sessionUser: UserProfile | null;
  status: SessionStatus;
  setUser: (user: UserProfile | null) => void;
  setStatus: (status: SessionStatus) => void;
}

export const useAuthSessionStore = create<AuthSessionState>((set) => ({
  sessionUser: null,
  status: 'loading', // Start altijd als 'loading'
  setUser: (user) => set({ sessionUser: user, status: user ? 'authenticated' : 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}));