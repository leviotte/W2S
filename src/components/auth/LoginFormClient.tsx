// src/components/auth/LoginFormClient.tsx
'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import type { AuthActionResult } from '@/lib/server/actions/auth';

interface Props {
  handleLogin: (data: { email: string; password: string }) => Promise<AuthActionResult>;
}

export default function LoginFormClient({ handleLogin }: Props) {
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email')?.toString() ?? '',
      password: formData.get('password')?.toString() ?? '',
    };

    try {
      const result = await handleLogin(data);

      if (!result.success) {
        toast.error(result.error || 'Login mislukt');
      } else {
        toast.success('Succesvol ingelogd!');
        if (result.data?.redirectTo) {
          window.location.href = result.data.redirectTo;
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Onverwachte fout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md mx-auto">
      <input
        name="email"
        type="email"
        placeholder="naam@voorbeeld.com"
        required
        className="w-full border px-3 py-2 rounded"
      />
      <input
        name="password"
        type="password"
        placeholder="Wachtwoord"
        required
        className="w-full border px-3 py-2 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Bezig...' : 'Login'}
      </button>
    </form>
  );
}
