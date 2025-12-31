// src/components/auth/social-auth-buttons.tsx
'use client';
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { toast } from 'sonner';
import { completeSocialLoginAction } from '@/lib/server/actions/auth';
import { getClientAuth } from '@/lib/client/firebase';

export function SocialAuthButtons() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const handleLogin = async (providerName: 'google' | 'apple') => {
    setLoading(providerName);
    try {
      const auth = getClientAuth();
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      // LET OP: hier mag je rechtstreeks naar server action sturen, want het pattern is identiek:
      await completeSocialLoginAction(idToken, providerName);
    } catch (err: any) {
      toast.error(err.message || `${providerName} login mislukt`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button onClick={() => handleLogin('google')} disabled={!!loading}>Google</button>
      <button onClick={() => handleLogin('apple')} disabled={!!loading}>Apple</button>
    </div>
  );
}