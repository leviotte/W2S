"use client";

import { useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Correcte import is hier al
import { auth, db } from '@/lib/client/firebase';
import type { UserProfile } from '@/types/user';

/**
 * Deze provider overbrugt de kloof tussen Server Components en de client-side Zustand store.
 * Het gebruikt de server-fetched user data om de initiële state te 'hydrateren'
 * en zet daarna een real-time listener op voor synchronisatie.
 */
export function StoreProvider({
  currentUser,
}: {
  currentUser: UserProfile | null;
}) {
  const isInitialized = useRef(false);

  if (!isInitialized.current) {
    useAuthStore.setState({ currentUser, isInitialized: true, loading: false });
    isInitialized.current = true;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const {
        setCurrentUser: setStoreUser,
        loadWishlists,
        loadEvents,
        currentUser: currentStoreUser
      } = useAuthStore.getState();

      if (user) {
        if (user.uid !== currentStoreUser?.id) {
          const userDocRef = doc(db, 'users', user.uid);
          
          // --- DE CORRECTIE ---
          // Gebruik de modulaire getDoc() functie van de Client SDK
          const userDoc = await getDoc(userDocRef); 
          
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setStoreUser(profile);
            await loadWishlists();
            await loadEvents();
          } else {
            await auth.signOut();
            setStoreUser(null);
          }
        }
      } else if (currentStoreUser) {
        setStoreUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}