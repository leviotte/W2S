import { create } from 'zustand';
import type { UserProfile } from '@/types/user';
import type { Wishlist } from '@/types/wishlist';

type ModalType = "login" | "register" | "forgotPassword";

interface AuthState {
  // ===== USER STATE =====
  currentUser: UserProfile | null;
  isInitialized: boolean;
  
  // ===== WISHLISTS (for legacy compatibility) =====
  wishlists: Wishlist[];
  
  // ===== MODAL STATE =====
  activeModal: ModalType | null;
  onSuccessCallback: (() => void) | null;
  
  // ===== ACTIONS =====
  setCurrentUser: (user: UserProfile | null) => void;
  setInitialized: (initialized: boolean) => void;
  setWishlists: (wishlists: Wishlist[]) => void;
  
  // Modal actions
  openModal: (modal: ModalType, onSuccess?: () => void) => void;
  closeModal: () => void;
  
  // ✅ LEGACY COMPATIBILITY
  isLoginModalOpen: boolean;
  hideLoginModal: () => void;
  openLoginModal: (onSuccess?: () => void) => void;
  openRegisterModal: (onSuccess?: () => void) => void;
  openForgotPasswordModal: () => void;
  open: (modal: ModalType, onSuccess?: () => void) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // ===== INITIAL STATE =====
  currentUser: null,
  isInitialized: false,
  wishlists: [],
  activeModal: null,
  onSuccessCallback: null,
  
  // ✅ COMPUTED PROPERTY
  get isLoginModalOpen() {
    return get().activeModal === 'login';
  },
  
  // ===== CORE ACTIONS =====
  setCurrentUser: (user) => set({ currentUser: user }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setWishlists: (wishlists) => set({ wishlists }),
  
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
  
  open: (modal, onSuccess) => 
    set({ 
      activeModal: modal, 
      onSuccessCallback: onSuccess || null 
    }),
}));

export const useCurrentUser = () => useAuthStore((state) => state.currentUser);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.currentUser);
export const useActiveModal = () => useAuthStore((state) => state.activeModal);
export const useIsLoginModalOpen = () => useAuthStore((state) => state.activeModal === 'login');