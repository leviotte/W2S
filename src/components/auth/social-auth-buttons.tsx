// src/components/auth/social-auth-buttons.tsx
'use client';

import { useState, startTransition } from 'react';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { toast } from 'sonner';
import { getClientAuth } from '@/lib/client/firebase';
import { useRouter } from 'next/navigation';
import type { AuthActionResult } from '@/lib/server/actions/auth';
import { completeSocialLoginAction } from '@/lib/server/actions/auth';

export function SocialAuthButtons() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const router = useRouter();

  const handleSocialLogin = (providerName: 'google' | 'apple') => {
    startTransition(async () => {
      setLoading(providerName);
      try {
        const auth = getClientAuth();
        const provider =
          providerName === 'google'
            ? new GoogleAuthProvider()
            : new OAuthProvider('apple.com');

        // 🔹 Firebase popup login
        const firebaseResult = await signInWithPopup(auth, provider);
        const idToken = await firebaseResult.user.getIdToken();

        // 🔹 Server-side login (session wordt server-side gezet)
        const result: AuthActionResult = await completeSocialLoginAction(
          idToken,
          providerName
        );

        if (result.success) {
          toast.success('Login succesvol!');
          router.push(result.data?.redirectTo ?? '/dashboard');
        } else {
          toast.error(result.error ?? 'Login mislukt');
        }
      } catch (err: any) {
        toast.error(err?.message ?? `${providerName} login mislukt`);
      } finally {
        setLoading(null);
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4" suppressHydrationWarning>
      <button
        onClick={() => handleSocialLogin('google')}
        disabled={!!loading}
        className="px-4 py-2 border rounded"
      >
        {loading === 'google' ? 'Loading…' : 'Google'}
      </button>
      <button
        onClick={() => handleSocialLogin('apple')}
        disabled={!!loading}
        className="px-4 py-2 border rounded"
      >
        {loading === 'apple' ? 'Loading…' : 'Apple'}
      </button>
    </div>
  );
}
