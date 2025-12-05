/**
 * lib/store/use-auth-store.ts
 *
 * Geünificeerde Zustand store voor authenticatie.
 * Gebruikt de correcte, van Zod afgeleide types uit @/types/user.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile as fbUpdateProfile,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/client/firebase';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/user';

export type AuthModalView = 'login' | 'register' | 'forgot_password';

interface AuthState {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  authModal: {
    open: boolean;
    view: AuthModalView;
  };
  // TOEGEVOEGD: Definitie voor de StoreInitializer
  setCurrentUser: (user: UserProfile | null) => void;
  setAuthModalState: (state: Partial<AuthState['authModal']>) => void;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  register: (
    data: Omit<UserProfile, 'id'>,
    password: string
  ) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      loading: false,
      error: null,
      authModal: { open: false, view: 'login' },

      // TOEGEVOEGD: Implementatie van de setCurrentUser functie
      setCurrentUser: (user) => set({ currentUser: user }),

      setAuthModalState: (newState) =>
        set((state) => ({ authModal: { ...state.authModal, ...newState } })),

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          await setPersistence(auth, browserLocalPersistence);
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          const idToken = await userCredential.user.getIdToken();
          // FIX: 'const response =' toegevoegd
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) throw new Error('Failed to create server session.');

          const ref = doc(db, 'users', userCredential.user.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) throw new Error("User profile not found in Firestore.");

          const userProfile = snap.data() as UserProfile;

          set({ currentUser: userProfile, loading: false });
          toast.success(`Welkom terug, ${userProfile.firstName}!`);
          return userProfile;

        } catch (err: any) {
          console.error('[Login Error]', err);
          const msg = 'Incorrect email or password.';
          toast.error(msg);
          set({ error: msg, loading: false });
          return null;
        }
      },

      register: async (data, password) => {
        set({ loading: true, error: null });
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);

          await fbUpdateProfile(userCredential.user, {
            displayName: `${data.firstName} ${data.lastName}`,
            photoURL: data.photoURL || null,
          });

          await sendEmailVerification(userCredential.user);

          const profileForDb: UserProfile & { createdAt: Timestamp } = {
            ...data,
            id: userCredential.user.uid,
            createdAt: Timestamp.now(),
          };

          await setDoc(doc(db, "users", profileForDb.id), profileForDb);

          await signOut(auth);
          
          toast.success("Verificatie-email verzonden!", {
            description: "Controleer je inbox om je account te activeren."
          });
          return true;

        } catch (err: any) {
          const msg = err.code === "auth/email-already-in-use"
              ? "Dit e-mailadres is al in gebruik."
              : "Registratie mislukt.";
          toast.error(msg);
          set({ error: msg, loading: false });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          console.error('Failed to clear server session, proceeding with client logout.', error);
        } finally {
          await signOut(auth);
          set({ currentUser: null, error: null, loading: false });
          toast.info("Je bent nu uitgelogd.");
        }
      },
    }),
    {
      name: 'wish2share-auth-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: { currentUser: state.currentUser },
            version: 0,
          };
        },
        setItem: (name, newValue) => {
          const str = JSON.stringify({
            state: { currentUser: newValue.state.currentUser },
            version: 0,
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export const useAuthModal = () => {
  const { authModal, setAuthModalState, currentUser } = useAuthStore();
  
  const showLogin = () => setAuthModalState({ open: true, view: 'login' });
  const showRegister = () => setAuthModalState({ open: true, view: 'register' });
  const closeModal = () => setAuthModalState({ open: false });

  return { ...authModal, showLogin, showRegister, closeModal, isLoggedIn: !!currentUser };
}