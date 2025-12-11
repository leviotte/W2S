'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/client/firebase';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { getUserProfileByIdAction } from '@/lib/server/actions/user-actions';
import AuthSpinner from '@/components/layout/auth-spinner';

/**
 * ✅ FIXED: Auth Provider met correcte Zustand API
 * 
 * Deze provider:
 * 1. Luistert naar Firebase auth state changes
 * 2. Haalt user profile op via Server Action
 * 3. Update Zustand store met user data
 * 4. Toont spinner tijdens initiële load
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // ✅ CORRECTE SELECTORS
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Gebruiker ingelogd - haal profiel op
          const profile = await getUserProfileByIdAction(firebaseUser.uid);

          if (profile?.id) {
            // ✅ Profile gevonden - update store
            setCurrentUser(profile);
          } else {
            // Profile niet gevonden in DB
            console.error('AuthProvider: User profile not found in DB for UID:', firebaseUser.uid);
            setCurrentUser(null);
          }
        } else {
          // Niet ingelogd
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Unexpected error in AuthProvider:', error);
        setCurrentUser(null);
      } finally {
        // Markeer als geïnitialiseerd
        setInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser, setInitialized]);

  // Toon spinner tijdens initiële auth check
  if (!isInitialized) {
    return <AuthSpinner />;
  }

  return <>{children}</>;
}