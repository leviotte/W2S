// src/hooks/use-auth.tsx
import { useAuthStore, useCurrentUser, useIsAuthenticated, useIsAdmin } from '@/lib/store/use-auth-store';

export function useAuth() {
  const currentUser = useCurrentUser();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);
  const closeModal = useAuthStore((state) => state.closeModal);

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    openLoginModal,
    openRegisterModal,
    closeModal,
  };
}