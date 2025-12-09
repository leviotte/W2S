// src/components/providers/auth-provider.tsx
'use client';

import { useEffect } from 'react';
import { useAuthSessionStore } from '@/lib/store/use-auth-store';
import { getSession } from '@/lib/auth/actions';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setStatus } = useAuthSessionStore();

  useEffect(() => {
    // Deze functie wordt maar één keer uitgevoerd wanneer de app laadt.
    const initializeSession = async () => {
      try {
        const session = await getSession();
        // Als de sessie bestaat, zetten we de gebruiker in de store. Anders is het null.
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        // Zelfs bij een fout, zetten we de status op 'unauthenticated'.
        setUser(null);
      }
    };

    initializeSession();
  }, [setUser, setStatus]); // Dependencies zodat de effect-hook correct werkt

  return <>{children}</>;
}