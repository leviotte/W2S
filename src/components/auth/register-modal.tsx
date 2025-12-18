// src/components/auth/register-modal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RegisterForm } from './register-form';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: RegisterModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* ✅ Grotere max-width voor register form (meer velden) */}
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Registreer</DialogTitle>
          <DialogDescription>Maak een nieuw Wish2Share-account aan</DialogDescription>
        </DialogHeader>
        <RegisterForm
          onSuccess={onClose}
          onSwitchToLogin={onSwitchToLogin}
        />
      </DialogContent>
    </Dialog>
  );
}