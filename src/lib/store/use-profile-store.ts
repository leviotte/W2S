// src/lib/store/use-profile-store.ts
import { create } from 'zustand';
import type { UserProfile } from '@/types/user'; // We gebruiken onze single-source-of-truth

// Dit is de 'main' user account, voorgesteld als een profiel
export const MAIN_ACCOUNT_PROFILE_ID = 'main-account';

export interface ProfileStoreState {
  profiles: UserProfile[];
  activeProfileId: string | null;
  loading: boolean;
}

export interface ProfileStoreActions {
  setProfiles: (profiles: UserProfile[]) => void;
  setActiveProfileId: (profileId: string | null) => void;
  setLoading: (loading: boolean) => void;
  getActiveProfile: () => UserProfile | null;
}

export const useProfileStore = create<ProfileStoreState & ProfileStoreActions>((set, get) => ({
  profiles: [],
  activeProfileId: null, // We starten zonder actief sub-profiel
  loading: true,

  setProfiles: (profiles) => set({ profiles }),
  setActiveProfileId: (profileId) => {
    // Sla de keuze op in localStorage voor persistentie
    if (profileId && profileId !== MAIN_ACCOUNT_PROFILE_ID) {
      localStorage.setItem('activeProfileId', profileId);
    } else {
      localStorage.removeItem('activeProfileId');
    }
    set({ activeProfileId: profileId });
  },
  setLoading: (loading) => set({ loading }),
  
  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    if (!activeProfileId || activeProfileId === MAIN_ACCOUNT_PROFILE_ID) {
      // Zoek naar het hoofdprofiel (dat geen 'owner' heeft of 'main' is)
      // Voor nu geven we null terug, de logica om het hoofdprofiel te vinden zit in de UI.
      return null;
    }
    return profiles.find(p => p.id === activeProfileId) || null;
  }
}));