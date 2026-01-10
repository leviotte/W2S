// src/components/auth/social-auth-buttons.tsx
'use client';
import { useState, startTransition } from 'react';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { toast } from 'sonner';
import { completeSocialLoginAction } from '@/lib/server/actions/auth';
import { getClientAuth } from '@/lib/client/firebase';
import { useRouter } from 'next/navigation';

export function SocialAuthButtons() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const router = useRouter();

  const handleLogin = (providerName: 'google' | 'apple') => {
    startTransition(async () => {
      setLoading(providerName);
      try {
        const auth = getClientAuth();
        const provider = providerName === 'google' ? new GoogleAuthProvider() : new OAuthProvider('apple.com');
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();

        const actionResult = await completeSocialLoginAction(idToken, providerName);
        if (actionResult.success) {
          toast.success('Login succesvol!');
          router.push(actionResult.data?.redirectTo ?? '/dashboard');
        } else {
          toast.error(actionResult.error ?? 'Login mislukt');
        }
      } catch (err: any) {
        toast.error(err.message || `${providerName} login mislukt`);
      } finally {
        setLoading(null);
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button onClick={() => handleLogin('google')} disabled={!!loading}>
        {loading === 'google' ? 'Loading…' : 'Google'}
      </button>
      <button onClick={() => handleLogin('apple')} disabled={!!loading}>
        {loading === 'apple' ? 'Loading…' : 'Apple'}
      </button>
    </div>
  );
}
