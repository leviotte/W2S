'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/client/firebase';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { getUserProfileAction } from '@/lib/actions/user-actions'; // We zullen deze action zo meteen aanmaken
import AuthSpinner from '@/components/layout/auth-spinner';

/**
 * MENTOR'S OPMERKING: De Brug tussen Firebase en de App
 *
 * Dit component is de EERSTE en ENIGE plek waar we luisteren naar 'onAuthStateChanged' van Firebase.
 * Zijn taak is simpel:
 * 1. Bij het laden van de app, luister naar de auth-status van Firebase.
 * 2. Als een gebruiker is ingelogd, haal via een Server Action ons VOLLEDIGE 'UserProfile' object op.
 * 3. Update onze 'useAuthStore' (Zustand) met de correcte data en status.
 * 4. Als de gebruiker niet is ingelogd, zet de state op 'unauthenticated'.
 * 5. Zet een 'isInitialized' flag in de store op 'true' om aan te geven dat de eerste check klaar is.
 *    Dit voorkomt een lelijke 'flicker' van de UI.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // We selecteren de functies en state die we nodig hebben.
  // Dit is efficiënter en voorkomt onnodige re-renders.
  const setAuth = useAuthStore((state) => state.setAuth);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    // Deze useEffect draait maar één keer, wanneer de app op de client 'hydrate'.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Gebruiker ingelogd bij Firebase. Haal ons profiel op via een Server Action.
          const result = await getUserProfileAction(firebaseUser.uid);

          if (result.success && result.data) {
            // Success! We hebben het profiel. Update de store.
            setAuth(result.data, 'authenticated');
          } else {
            // Fout: Gebruiker bestaat in Firebase Auth maar niet in onze DB. We loggen uit.
            console.error('AuthProvider:', result.error || 'User profile not found in DB.');
            setAuth(null, 'unauthenticated');
          }
        } else {
          // Geen gebruiker ingelogd bij Firebase.
          setAuth(null, 'unauthenticated');
        }
      } catch (error) {
        console.error('Unexpected error in AuthProvider:', error);
        setAuth(null, 'unauthenticated');
      } finally {
        // Heel belangrijk: geef aan dat de initiële auth-check voltooid is.
        setInitialized(true);
      }
    });

    // Cleanup functie: stopt met luisteren als het component unmount.
    return () => unsubscribe();
  }, [setAuth, setInitialized]);

  // Voorkom UI-flicker: toon een spinner (of niets) tot de check klaar is.
  if (!isInitialized) {
    return <AuthSpinner />;
  }

  // De check is klaar, de store is up-to-date. Toon de rest van de app.
  return <>{children}</>;
}