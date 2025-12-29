// src/components/providers/auth-provider.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/client/firebase';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { ensureUserProfileAction } from '@/lib/server/actions/user-actions';
import AuthSpinner from '@/components/layout/auth-spinner';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            /**
             * 🔐 Firebase Auth = identiteit
             * 📄 Firestore user = applicatieprofiel
             * ✅ Bestaat het profiel niet? → automatisch aanmaken
             */
            const profile = await ensureUserProfileAction({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });

            if (!profile?.id) {
              throw new Error('AuthProvider: failed to ensure user profile');
            }

            setCurrentUser(profile);
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('AuthProvider error:', error);
          setCurrentUser(null);
        } finally {
          setInitialized(true);
        }
      }
    );

    return () => unsubscribe();
  }, [setCurrentUser, setInitialized]);

  if (!isInitialized) {
    return <AuthSpinner />;
  }

  return <>{children}</>;
}

/**
 * 🔁 Centrale sessie-hook
 * Overal in de app bruikbaar
 */
export function useSession() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  return {
    user: currentUser,
    isLoading: !isInitialized,
    isAuthenticated: !!currentUser,
  };
}