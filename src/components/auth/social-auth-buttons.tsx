// src/components/auth/social-auth-buttons.tsx
'use client';

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

import { getClientAuth } from '@/lib/client/firebase';
import { completeSocialLoginAction } from '@/lib/server/actions/auth';

export function SocialAuthButtons() {
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading('google');
    try {
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const idToken = await result.user.getIdToken();
      const serverResult = await completeSocialLoginAction(idToken, 'google');

      if (serverResult.success) {
        toast.success('Welkom bij Wish2Share!');
        router.push(serverResult.data?.redirectTo || '/dashboard');
        router.refresh();
      } else {
        toast.error(serverResult.error || 'Login mislukt');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Google login mislukt';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login geannuleerd';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup geblokkeerd. Sta popups toe voor deze site.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading('apple');
    try {
      const auth = getClientAuth();
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      
      const result = await signInWithPopup(auth, provider);
      
      const idToken = await result.user.getIdToken();
      const serverResult = await completeSocialLoginAction(idToken, 'apple');

      if (serverResult.success) {
        toast.success('Welkom bij Wish2Share!');
        router.push(serverResult.data?.redirectTo || '/dashboard');
        router.refresh();
      } else {
        toast.error(serverResult.error || 'Login mislukt');
      }
    } catch (error: any) {
      console.error('Apple login error:', error);
      
      let errorMessage = 'Apple login mislukt';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login geannuleerd';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup geblokkeerd. Sta popups toe voor deze site.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* ✅ GROENE BORDER - exact als productie */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAppleLogin}
        disabled={!!isLoading}
        className="w-full bg-white border-[#6B8E23] hover:bg-gray-50"
      >
        {isLoading === 'apple' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FaApple className="mr-2 h-5 w-5" />
        )}
        Apple
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={!!isLoading}
        className="w-full bg-white border-[#6B8E23] hover:bg-gray-50"
      >
        {isLoading === 'google' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FcGoogle className="mr-2 h-5 w-5" />
        )}
        Google
      </Button>
    </div>
  );
}