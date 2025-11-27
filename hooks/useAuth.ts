'use client';

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/client/firebase';
import { User, Profile } from '@/types'; // We definiëren deze types zo meteen

// --- Interface voor onze context ---
interface AuthContextType {
  user: User | null;
  profiles: Profile[];
  activeProfile: Profile | null;
  loading: boolean;
  switchToProfile: (profileId: string) => void;
  // TODO: Add login/logout/register functions here
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


// --- De Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Luister naar veranderingen in Firebase Authentication
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Gebruiker is ingelogd, haal Firestore data op
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
            console.error("Geen user document gevonden in Firestore voor de ingelogde gebruiker.");
            setUser(null);
        }
      } else {
        // Gebruiker is uitgelogd
        setUser(null);
        setProfiles([]);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Luister naar veranderingen in de profielen van de ingelogde gebruiker
    if (user?.uid) {
        const profilesColRef = collection(db, 'users', user.uid, 'profiles');
        const unsubscribeProfiles = onSnapshot(profilesColRef, (snapshot) => {
            const profilesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
            setProfiles(profilesData);

            // Check active profile from localStorage
            const activeProfileId = localStorage.getItem('activeProfile');
            const foundProfile = profilesData.find(p => p.id === activeProfileId);
            setActiveProfile(foundProfile || null);
        });

        return () => unsubscribeProfiles();
    }
  }, [user]);


  const switchToProfile = (profileId: string) => {
    if (profileId === 'main-account') {
        localStorage.removeItem('activeProfile');
        setActiveProfile(null);
    } else {
        localStorage.setItem('activeProfile', profileId);
        const foundProfile = profiles.find(p => p.id === profileId);
        setActiveProfile(foundProfile || null);
    }
  };


  return (
    <AuthContext.Provider value={{ user, profiles, activeProfile, loading, switchToProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- De Custom Hook ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}