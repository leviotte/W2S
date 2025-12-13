/**
 * hooks/use-auth.tsx
 * 
 * Convenience hook voor auth operaties
 * Wrapper rond useAuthStore voor backwards compatibility
 */

import { useAuthStore } from '@/lib/store/use-auth-store';

export function useAuth() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);
  const closeModal = useAuthStore((state) => state.closeModal);
  const activeModal = useAuthStore((state) => state.activeModal);
  
  return {
    currentUser,
    isAuthenticated: !!currentUser,
    showLoginModal: openLoginModal,
    showRegisterModal: openRegisterModal,
    closeModal,
    activeModal,
    // Aliases voor backwards compatibility
    openLoginModal,
    openRegisterModal,
  };
}

// Re-export store hooks for convenience
export { 
  useCurrentUser, 
  useIsAuthenticated, 
  useIsLoginModalOpen 
} from '@/lib/store/use-auth-store';