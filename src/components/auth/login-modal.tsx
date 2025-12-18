// src/components/auth/login-modal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoginForm } from './login-form';
import { PasswordResetForm } from './PasswordResetForm';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  returnUrl?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
  returnUrl,
}: LoginModalProps) {
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm md:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {isResettingPassword ? 'Reset Wachtwoord' : 'Log in'}
          </DialogTitle>
          <DialogDescription>
            {isResettingPassword 
              ? 'Reset je Wish2Share wachtwoord' 
              : 'Log in op je Wish2Share-account'}
          </DialogDescription>
        </DialogHeader>
        
        {isResettingPassword ? (
          <PasswordResetForm
            onSuccess={onClose}
            onBackToLogin={() => setIsResettingPassword(false)}
          />
        ) : (
          <LoginForm
            onSuccess={onClose}
            onSwitchToRegister={onSwitchToRegister}
            onSwitchToForgotPassword={() => setIsResettingPassword(true)}
            returnUrl={returnUrl}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}