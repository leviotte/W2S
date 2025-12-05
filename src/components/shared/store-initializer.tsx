'use client';

import { useRef, useEffect } from 'react';
// FIX: We importeren de correct genaamde 'useAuthStore'
import { useAuthStore } from '@/lib/store/use-auth-store'; 
import type { UserProfile } from '@/types/user';

interface StoreInitializerProps {
  user: UserProfile | null;
}

/**
 * Dit client component heeft maar één taak: de server-side user data
 * (opgehaald in een Server Component) synchroniseren met de client-side
 * Zustand store bij de eerste render. Dit voorkomt hydration errors.
 */
function StoreInitializer({ user }: StoreInitializerProps) {
  // Gebruik useRef om te zorgen dat dit maar één keer gebeurt per component-instantie.
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // FIX: We roepen de state aan op de correcte store 'useAuthStore'
      useAuthStore.getState().setCurrentUser(user);
      initialized.current = true;
    }
  }, [user]); // De dependency array zorgt ervoor dat de store update als de user-prop verandert.

  return null; // Dit component rendert zelf niets, het is puur voor logica.
}

export default StoreInitializer;