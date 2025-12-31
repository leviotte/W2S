// src/app/(auth)/login/_components/register-client.tsx
'use client';

import { RegisterFormUI, type RegisterFormValues } from '@/components/auth/register-form-ui';
import { startTransition } from 'react';
import { toast } from 'sonner';
import { getClientAuth } from '@/lib/client/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { RegisterFormServer } from '@/components/auth/register-form.server';

interface RegisterClientProps {
  onSwitchToLogin?: () => void;
}

export function RegisterClient({ onSwitchToLogin }: RegisterClientProps) {
  const handleSubmit = (data: RegisterFormValues) => {
    startTransition(async () => {
      try {
        const auth = getClientAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const idToken = await userCredential.user.getIdToken();
        // Map alles wat server nodig heeft – let op: camelCase/TS laten matchen!
        const serverData = {
          idToken,
          firstName: data.firstName,
          lastName: data.lastName,
          birthdate: data.birthDate,
          gender: data.gender,
          country: data.country,
          location: data.location,
        };
        const result = await RegisterFormServer(serverData);
        if (result.success) {
          toast.success('Account aangemaakt!');
          onSwitchToLogin?.();
        } else {
          toast.error(result.error || 'Registratie mislukt');
        }
      } catch (err: any) {
        toast.error(err.message || 'Registratie mislukt');
      }
    });
  };

  return <RegisterFormUI onSubmit={handleSubmit} onSwitchToLogin={onSwitchToLogin} />;
}