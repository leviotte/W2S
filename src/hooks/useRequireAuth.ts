// src/hooks/useRequireAuth.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/use-auth-store';

/**
 * Hook om te zorgen dat alleen ingelogde users toegang hebben
 * Redirect naar login als niet authenticated
 */
export function useRequireAuth() {
  const router = useRouter();
  const { currentUser, isInitialized, openLoginModal } = useAuthStore();

  useEffect(() => {
    // Wacht tot auth initialized is
    if (!isInitialized) return;

    // Als geen user, redirect naar login
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, isInitialized, router]);

  return { currentUser, isLoading: !isInitialized };
}