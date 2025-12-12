'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/client/firebase';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { getUserProfileAction } from '@/lib/server/actions/user-actions';
import AuthSpinner from '@/components/layout/auth-spinner';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          const profile = await getUserProfileAction(firebaseUser.uid);

          if (profile?.id) {
            setCurrentUser(profile);
          } else {
            console.error('AuthProvider: User profile not found in DB for UID:', firebaseUser.uid);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Unexpected error in AuthProvider:', error);
        setCurrentUser(null);
      } finally {
        setInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser, setInitialized]);

  if (!isInitialized) {
    return <AuthSpinner />;
  }

  return <>{children}</>;
}

// ✅ FIX: Export useSession hook
export function useSession() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  return {
    user: currentUser,
    isLoading: !isInitialized,
    isAuthenticated: !!currentUser,
  };
}