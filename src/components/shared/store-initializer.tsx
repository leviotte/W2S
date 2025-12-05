'use client';

import { useRef, useEffect } from 'react';
import { useStore } from '@/lib/store/use-auth-store';
import type { UserProfile } from '@/types/global';

interface StoreInitializerProps {
  user: UserProfile | null;
}

function StoreInitializer({ user }: StoreInitializerProps) {
  // Gebruik useRef om te zorgen dat dit maar één keer gebeurt per pageload.
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      useStore.getState().setCurrentUser(user);
      initialized.current = true;
    }
  }, [user]); // Afhankelijk van user, zodat het update bij login/logout.

  return null; // Dit component rendert zelf niets.
}

export default StoreInitializer;