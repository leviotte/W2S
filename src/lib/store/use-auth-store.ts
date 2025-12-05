import { create } from 'zustand';
import { UserProfile } from '@/types/user';

// 1. Definieer de mogelijke views voor de modal
export type AuthModalView = 'login' | 'register' | 'forgot_password';

// 2. Definieer de state voor de modal
export interface AuthModalState {
  open: boolean;
  view: AuthModalView;
}

// 3. Breid de hoofd 'Store' interface uit
export interface Store {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  
  // Nieuwe state voor de authenticatie modal
  authModal: AuthModalState;
  setAuthModalState: (state: Partial<AuthModalState>) => void;
}

// 4. Update de store-creatie met de nieuwe state en acties
export const useStore = create<Store>((set) => ({
  // Bestaande state
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Nieuwe state en de functie om deze aan te passen
  authModal: {
    open: false,
    view: 'login',
  },
  setAuthModalState: (newState) =>
    set((state) => ({
      authModal: { ...state.authModal, ...newState },
    })),
}));