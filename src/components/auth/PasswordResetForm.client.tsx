// src/components/auth/PasswordResetForm.client.tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { PasswordResetFormServer } from './password-reset-form.server';

export function PasswordResetFormClient() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (email: string) => {
    startTransition(async () => {
      const result = await PasswordResetFormServer({ email });
      if (result.success) {
        toast.success('Controleer je inbox!');
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    // UI form hier, call handleSubmit bij submit
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e.currentTarget.email.value); }}>
      <input name="email" type="email" placeholder="naam@voorbeeld.com" />
      <button type="submit" disabled={isPending}>Reset Password</button>
    </form>
  );
}
