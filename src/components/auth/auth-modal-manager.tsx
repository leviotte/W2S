// src/components/auth/auth-modal-manager.tsx
'use client';

import { useAuthStore } from '@/lib/store/use-auth-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LoginFormUI } from './login-form-ui';
import { RegisterFormUI } from './register-form-ui';
import { startTransition } from 'react';
import { completeLoginAction, completeRegistrationAction } from '@/lib/server/actions/auth';
import { toast } from 'sonner';

export function AuthModalManager() {
  const activeModal = useAuthStore((state) => state.activeModal);
  const closeModal = useAuthStore((state) => state.closeModal);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);

  const handleLogin = (data: any) => {
    startTransition(async () => {
      try {
        const result = await completeLoginAction(data.idToken);
        if (result.success) {
          toast.success('Welkom terug!');
          closeModal();
        } else {
          toast.error(result.error || 'Login mislukt');
        }
      } catch (err: any) {
        toast.error(err.message || 'Login mislukt');
      }
    });
  };

  const handleRegister = (data: any) => {
    startTransition(async () => {
      try {
        const result = await completeRegistrationAction(data);
        if (result.success) {
          toast.success('Account aangemaakt!');
          openLoginModal();
        } else {
          toast.error(result.error || 'Registratie mislukt');
        }
      } catch (err: any) {
        toast.error(err.message || 'Registratie mislukt');
      }
    });
  };

  return (
    <>
      <Dialog open={activeModal === 'login'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-sm md:max-w-md">
          <DialogHeader>
            <DialogTitle>Log in</DialogTitle>
            <DialogDescription>Log in op je account</DialogDescription>
          </DialogHeader>
          <LoginFormUI onSubmit={handleLogin} onSwitchToRegister={openLoginModal} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'register'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-sm md:max-w-md">
          <DialogHeader>
            <DialogTitle>Registreer</DialogTitle>
            <DialogDescription>Maak een nieuw account aan</DialogDescription>
          </DialogHeader>
          <RegisterFormUI onSubmit={handleRegister} onSwitchToLogin={openLoginModal} />
        </DialogContent>
      </Dialog>
    </>
  );
}
