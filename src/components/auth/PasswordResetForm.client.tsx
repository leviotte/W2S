// src/components/auth/PasswordResetForm.client.tsx
'use client';

import { useTransition, FormEvent } from 'react';
import { toast } from 'sonner';
import { PasswordResetFormServer } from './password-reset-form.server';

export function PasswordResetFormClient() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    const email = emailInput.value;

    if (!email) {
      toast.error('Vul een geldig e-mailadres in.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await PasswordResetFormServer({ email });
        if (result.success) {
          toast.success('Controleer je inbox voor de resetlink!');
          form.reset();
        } else {
          toast.error(result.error || 'Reset mislukt');
        }
      } catch (err: any) {
        toast.error(err.message || 'Reset mislukt');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <label className="flex flex-col">
        E-mailadres
        <input
          name="email"
          type="email"
          placeholder="naam@voorbeeld.com"
          required
          className="border rounded px-3 py-2 mt-1"
          disabled={isPending}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="bg-[#6B8E23] text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? 'Versturen…' : 'Reset Wachtwoord'}
      </button>
    </form>
  );
}
