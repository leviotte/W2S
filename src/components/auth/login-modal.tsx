// src/components/auth/login-modal.tsx
'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LoginFormServer } from './login-form.server';
import { RegisterFormServer } from './register-form.server';
import { toast } from 'sonner';
import { LoginFormUI } from './login-form-ui';
import { RegisterFormUI } from './register-form-ui';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleLogin = async (formData: any) => {
    startTransition(async () => {
      const result = await LoginFormServer(formData); // ✅ hier de server action
      if (result.success) {
        toast.success('Welkom terug!');
        onClose();
      } else {
        toast.error(result.error || 'Login mislukt');
      }
    });
  };

  const handleRegister = async (formData: any) => {
    startTransition(async () => {
      const result = await RegisterFormServer(formData); // ✅ hier de server action
      if (result.success) {
        toast.success('Account aangemaakt!');
        setMode('login');
      } else {
        toast.error(result.error || 'Registratie mislukt');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Log in' : 'Registreer'}</DialogTitle>
          <DialogDescription>
            {mode === 'login' ? 'Log in op je account' : 'Maak een nieuw account aan'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'login' ? (
          <LoginFormUI onSubmit={handleLogin} onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterFormUI onSubmit={handleRegister} onSwitchToLogin={() => setMode('login')} />
        )}
      </DialogContent>
    </Dialog>
  );
}
