// src/components/auth/auth-modal-manager.tsx
'use client';

import { useAuthStore } from '@/lib/store/use-auth-store';
import { LoginModal } from './login-modal';
import { RegisterModal } from './register-modal';

export function AuthModalManager() {
  const activeModal = useAuthStore((state) => state.activeModal);
  const closeModal = useAuthStore((state) => state.closeModal);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);

  return (
    <>
      <LoginModal
        isOpen={activeModal === 'login'}
        onClose={closeModal}
        onSwitchToRegister={openRegisterModal}
      />

      <RegisterModal
        isOpen={activeModal === 'register'}
        onClose={closeModal}
        onSwitchToLogin={openLoginModal}
      />
    </>
  );
}