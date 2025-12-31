// src/app/(auth)/login/_components/login-client.tsx
'use client';

import { LoginFormUI, type LoginFormValues } from '@/components/auth/login-form-ui';
import { startTransition } from 'react';
import { toast } from 'sonner';
import { getClientAuth } from '@/lib/client/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LoginFormServer } from '@/components/auth/login-form.server';

export function LoginClient() {
  const handleSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      try {
        const auth = getClientAuth();
        // 1️⃣ Firebase authenticatie client-side
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        // 2️⃣ ID token ophalen uit Firebase user
        const idToken = await userCredential.user.getIdToken();
        // 3️⃣ Server action aanroepen via bridge, mét idToken property
        const result = await LoginFormServer({ idToken }); // exact dit is de brug!
        if (result.success) {
          toast.success('Welkom terug!');
          // evt. redirect of close modal
        } else {
          toast.error(result.error || 'Login mislukt');
        }
      } catch (err: any) {
        toast.error(err.message || 'Login mislukt');
      }
    });
  };

  return <LoginFormUI onSubmit={handleSubmit} />;
}