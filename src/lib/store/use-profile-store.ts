import { create } from 'zustand';
import { collection, onSnapshot, query, where, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import { toast } from 'sonner';
import type { NextRouter } from 'next/router'; // Let op: je moet 'next/router' misschien installeren als je 'next/navigation' gebruikt. Voor nu gebruiken we de App Router's router.

// Definieer de types hier of importeer ze vanuit een centraal 'types' bestand.
export interface Profile {
  id: string;
  name: string;
  avatarURL?: string | null;
  createdBy?: string;
  managers?: string[];
  mainAccount?: boolean;
  isManaged?: boolean;
}

export interface User {
  id: string;
  firstName?: string;
  name?: string;
  photoURL?: string;
}

interface ProfileState {
  profiles: Profile[];
  activeProfile: Profile | null;
  loading: boolean;
  _listeners: (() => void)[]; // Interne state om unsubscribe functies bij te houden
  initializeProfiles: (user: User, router: any) => void;
  switchToProfile: (profileId: string | null, router: any) => Promise<void>;
  cleanupListeners: () => void;
  setProfiles: (profiles: Profile[]) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfile: null,
  loading: true,
  _listeners: [],

  setProfiles: (profiles) => set({ profiles }),

  cleanupListeners: () => {
    get()._listeners.forEach((unsubscribe) => unsubscribe());
    set({ _listeners: [] });
  },

  initializeProfiles: (user, router) => {
    get().cleanupListeners(); // Eerst oude listeners opruimen
    if (!user?.id) {
      set({ loading: false });
      return;
    }

    const mainProfile: Profile = {
      id: 'main-account',
      name: user.firstName || user.name || 'Hoofdaccount',
      avatarURL: user.photoURL ?? null,
      mainAccount: true,
    };
    
    // Herstel actieve profiel uit localStorage bij initialisatie
    const savedProfileId = localStorage.getItem('activeProfileId');
    // Start met het hoofdprofiel
    set({ activeProfile: mainProfile, loading: true });

    const createdByQuery = query(collection(db, 'profiles'), where('createdBy', '==', user.id));
    const managedQuery = query(collection(db, 'profiles'), where('managers', 'array-contains', user.id));

    const allProfiles: Map<string, Profile> = new Map();
    allProfiles.set(mainProfile.id, mainProfile);

    const processSnapshot = () => {
      const mergedList = Array.from(allProfiles.values());
      set({ profiles: mergedList, loading: false });
      
      // Nadat de profielen geladen zijn, kijk of het herstelde profiel bestaat
      if (savedProfileId) {
        const restoredProfile = mergedList.find(p => p.id === savedProfileId);
        if (restoredProfile) {
          set({ activeProfile: restoredProfile });
        }
      }
    };

    const unsubscribeCreated = onSnapshot(createdByQuery, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        allProfiles.set(doc.id, {
          id: doc.id,
          name: data.name || 'Onbekend Profiel', // Veilige mapping
          avatarURL: data.avatarURL || null,
          createdBy: data.createdBy,
          managers: data.managers,
          isManaged: data.createdBy !== user.id,
        });
      });
      processSnapshot();
    });

    const unsubscribeManaged = onSnapshot(managedQuery, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
         allProfiles.set(doc.id, {
          id: doc.id,
          name: data.name || 'Onbekend Profiel', // Veilige mapping
          avatarURL: data.avatarURL || null,
          createdBy: data.createdBy,
          managers: data.managers,
          isManaged: data.createdBy !== user.id,
        });
      });
      processSnapshot();
    });

    set({ _listeners: [unsubscribeCreated, unsubscribeManaged] });
  },

  switchToProfile: async (profileId, router) => {
    const { profiles, activeProfile } = get();
    if (activeProfile?.id === profileId) return;

    try {
      if (profileId === 'main-account' || profileId === null) {
        set({ activeProfile: profiles.find(p => p.mainAccount) || null });
        localStorage.removeItem('activeProfileId');
        toast.info('Gewisseld naar je hoofdaccount.');
        router.push('/dashboard');
        return;
      }

      const selectedProfile = profiles.find((p) => p.id === profileId);
      if (!selectedProfile) throw new Error('Profiel niet gevonden');

      set({ activeProfile: selectedProfile });
      localStorage.setItem('activeProfileId', selectedProfile.id);
      toast.success(`Actief profiel: ${selectedProfile.name}`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Wisselen van profiel mislukt', { description: err.message });
      console.error('Profile switch failed:', err);
    }
  },
}));