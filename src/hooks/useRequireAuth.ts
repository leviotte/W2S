// src/hooks/useRequireAuth.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/use-auth-store';

/**
 * Hook om een component of pagina te beschermen.
 * Controleert of de gebruiker is ingelogd. Zo niet, opent de login modal
 * en navigeert naar een fallback route (standaard de homepage).
 * @param redirectTo De route om naar te navigeren als de gebruiker niet is ingelogd.
 */
export const useRequireAuth = (redirectTo: string = '/') => {
  // Haal alles wat we nodig hebben uit ÉÉN centrale store
  const { currentUser, authStatus, openLoginModal } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wacht tot de authenticatiestatus bekend is.
    if (authStatus === 'loading') {
      return;
    }

    // Als het laden klaar is en er is geen gebruiker...
    if (authStatus === 'unauthenticated' && !currentUser) {
      // 1. Vraag de modal om te openen (via de store)
      openLoginModal();
      // 2. Stuur de gebruiker weg
      router.push(redirectTo);
    }
  }, [currentUser, authStatus, router, openLoginModal, redirectTo]);

  // Geef de status terug, zodat het component weet of het moet renderen
  return { authStatus, currentUser };
};