// src/lib/store/use-auth-store.ts
import { create } from 'zustand';
import type { UserProfile } from '@/types/user';

/**
 * ✅ MINIMALE AUTH STORE - Next.js 16 Gold Standard
 * 
 * Deze store bevat ALLEEN client-side UI state.
 * - User data komt van server session (auth-provider.tsx)
 * - Data mutations gebeuren via Server Actions
 * - Zustand alleen voor transient UI state (modals, etc.)
 */

// ============================================================================
// TYPES
// ============================================================================

type ModalType = "login" | "register" | "forgotPassword";

interface AuthState {
  // ===== USER STATE (synced from server) =====
  currentUser: UserProfile | null;
  isInitialized: boolean;
  
  // ===== MODAL STATE (pure client UI) =====
  activeModal: ModalType | null;
  onSuccessCallback: (() => void) | null;
  
  // ===== ACTIONS =====
  setCurrentUser: (user: UserProfile | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Modal actions
  openModal: (modal: ModalType, onSuccess?: () => void) => void;
  closeModal: () => void;
  
  // ✅ LEGACY COMPATIBILITY METHODS (om errors te voorkomen)
  isLoginModalOpen: boolean; // Computed property
  hideLoginModal: () => void;
  openLoginModal: (onSuccess?: () => void) => void;
  openRegisterModal: (onSuccess?: () => void) => void;
  openForgotPasswordModal: () => void;
  open: (modal: ModalType, onSuccess?: () => void) => void; // Alias voor openModal
}

// ============================================================================
// STORE
// ============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // ===== INITIAL STATE =====
  currentUser: null,
  isInitialized: false,
  activeModal: null,
  onSuccessCallback: null,
  
  // ✅ COMPUTED PROPERTY
  get isLoginModalOpen() {
    return get().activeModal === 'login';
  },
  
  // ===== CORE ACTIONS =====
  setCurrentUser: (user) => set({ currentUser: user }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  
  // ===== MODAL ACTIONS =====
  openModal: (modal, onSuccess) => 
    set({ 
      activeModal: modal, 
      onSuccessCallback: onSuccess || null 
    }),
  
  closeModal: () => 
    set({ 
      activeModal: null, 
      onSuccessCallback: null 
    }),
  
  // ===== CONVENIENCE METHODS =====
  hideLoginModal: () => 
    set({ 
      activeModal: null, 
      onSuccessCallback: null 
    }),
  
  openLoginModal: (onSuccess) => 
    set({ 
      activeModal: "login", 
      onSuccessCallback: onSuccess || null 
    }),
  
  openRegisterModal: (onSuccess) => 
    set({ 
      activeModal: "register", 
      onSuccessCallback: onSuccess || null 
    }),
  
  openForgotPasswordModal: () => 
    set({ 
      activeModal: "forgotPassword", 
      onSuccessCallback: null 
    }),
  
  // ✅ ALIAS (voor hero-actions.tsx)
  open: (modal, onSuccess) => 
    set({ 
      activeModal: modal, 
      onSuccessCallback: onSuccess || null 
    }),
}));

// ============================================================================
// SELECTORS (performance - memoized subscriptions)
// ============================================================================

export const useCurrentUser = () => useAuthStore((state) => state.currentUser);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.currentUser);
export const useActiveModal = () => useAuthStore((state) => state.activeModal);
export const useIsLoginModalOpen = () => useAuthStore((state) => state.activeModal === 'login');