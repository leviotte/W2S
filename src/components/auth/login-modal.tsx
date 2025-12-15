// src/components/auth/login-modal.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoginForm } from './login-form';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
  returnUrl?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
  onSwitchToForgotPassword,
  returnUrl,
}: LoginModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Log in</DialogTitle>
          <DialogDescription>Log in op je Wish2Share-account</DialogDescription>
        </DialogHeader>
        <LoginForm
          onSuccess={onClose}
          onSwitchToRegister={onSwitchToRegister}
          onSwitchToForgotPassword={onSwitchToForgotPassword}
          returnUrl={returnUrl}
        />
      </DialogContent>
    </Dialog>
  );
}