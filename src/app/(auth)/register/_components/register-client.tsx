// src/app/(auth)/login/_components/register-client.tsx
'use client';

import { RegisterFormUI, type RegisterFormValues } from '@/components/auth/register-form-ui';
import { startTransition } from 'react';
import { toast } from 'sonner';
import { RegisterFormServer } from '@/components/auth/register-form.server';
import { useRouter } from 'next/navigation';

export function RegisterClient() {
  const router = useRouter();

  const handleSubmit = (data: RegisterFormValues) => {
    startTransition(async () => {
      try {
        const result = await RegisterFormServer(data);
        if (result.success) {
          toast.success('Account aangemaakt. Check je e-mail.');
          // Optioneel: direct redirect naar login of dashboard
          router.push('/login');
        } else {
          toast.error(result.error);
        }
      } catch (e: any) {
        toast.error(e.message || 'Registratie mislukt');
      }
    });
  };

  return <RegisterFormUI onSubmit={handleSubmit} />;
}
