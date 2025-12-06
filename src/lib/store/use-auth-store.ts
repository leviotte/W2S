/**
 * src/lib/store/use-auth-store.ts
 *
 * GOUDSTANDAARD VERSIE 3.2: Correcte return types voor async actions.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile as fbUpdateProfile,
  setPersistence,
  browserLocalPersistence,
  signOut,
  updatePassword as fbUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '@/lib/client/firebase';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/user';
import type { Event } from '@/types/event';
import type { Wishlist } from '@/types/wishlist';

export type AuthModalView = 'login' | 'register' | 'forgot_password';

type CreateWishlistData = Pick<Wishlist, 'name' | 'isPrivate' | 'items'>;

interface AuthState {
  // STATE
  currentUser: UserProfile | null;
  wishlists: Wishlist[];
  events: Event[];
  loading: boolean;
  error: string | null;
  authModal: {
    open: boolean;
    view: AuthModalView;
  };
  isInitialized: boolean;

  // SETTERS & ACTIONS
  setCurrentUser: (user: UserProfile | null) => void;
  setInitialized: (status: boolean) => void;
  setAuthModalState: (state: Partial<AuthState['authModal']>) => void;
  
  // ASYNC ACTIONS (DATABASE)
  login: (email: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  register: (data: Omit<UserProfile, 'id'>, password: string) => Promise<boolean>;
  updateEvent: (eventId: string, data: Partial<Event>) => Promise<void>;
  updatePassword: (current: string, newPass: string) => Promise<void>;
  createWishlist: (wishlistData: CreateWishlistData) => Promise<string | null>;
  loadWishlists: () => Promise<void>;
  loadEvents: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      currentUser: null,
      wishlists: [],
      events: [],
      loading: true,
      error: null,
      authModal: { open: false, view: 'login' },
      isInitialized: false,

      // --- SETTERS ---
      setCurrentUser: (user) => set({ currentUser: user }),
      setInitialized: (status) => set({ isInitialized: status, loading: false }),
      setAuthModalState: (newState) =>
        set((state) => ({ authModal: { ...state.authModal, ...newState } })),

      // --- ASYNC ACTIONS ---

      loadWishlists: async () => {
        const { currentUser } = get();
        if (!currentUser) {
          set({ wishlists: [] });
          return; // CORRECTIE: Roep set aan, maar return void.
        }
        
        try {
          const q = query(
            collection(db, 'wishlists'),
            where('userId', '==', currentUser.id),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const userWishlists = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
            updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
          })) as Wishlist[];
          
          set({ wishlists: userWishlists });
        } catch (error) {
          console.error("Error loading wishlists: ", error);
          toast.error("Kon je wishlists niet laden.");
          set({ wishlists: [] });
        }
      },

      loadEvents: async () => {
        const { currentUser } = get();
        if (!currentUser) {
          set({ events: [] });
          return; // CORRECTIE: Roep set aan, maar return void.
        }
        
        try {
          const q = query(
            collection(db, 'events'),
            where('organizerId', '==', currentUser.id),
            orderBy('date', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const userEvents = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: (doc.data().date as Timestamp).toDate(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
            updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
          })) as Event[];

          set({ events: userEvents });
        } catch (error) {
          console.error("Error loading events: ", error);
          toast.error("Kon je evenementen niet laden.");
          set({ events: [] });
        }
      },

      createWishlist: async (wishlistData) => {
        const { currentUser, loadWishlists } = get();
        if (!currentUser) {
          toast.error('Je moet ingelogd zijn om een wishlist aan te maken.');
          return null;
        }

        set({ loading: true });
        try {
          const now = new Date();
          const slug = wishlistData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

          const newWishlistForDb = {
            ...wishlistData,
            userId: currentUser.id,
            profileId: null,
            slug: `${slug}-${Date.now()}`,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
          };

          const docRef = await addDoc(collection(db, 'wishlists'), newWishlistForDb);
          
          toast.success(`Wishlist '${wishlistData.name}' succesvol aangemaakt!`);
          await loadWishlists();
          return docRef.id;
        } catch (error) {
          console.error('Error creating wishlist:', error);
          toast.error('Kon de wishlist niet aanmaken.');
          return null;
        } finally {
          set({ loading: false });
        }
      },

      updateEvent: async (eventId, data) => {
        set({ loading: true });
        try {
          const eventRef = doc(db, 'events', eventId);
          await updateDoc(eventRef, { ...data, updatedAt: Timestamp.now() });
          toast.success("Evenement bijgewerkt!");
          await get().loadEvents();
        } catch (error) {
          console.error("Error updating event:", error);
          toast.error("Kon het evenement niet bijwerken.");
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      updatePassword: async (currentPassword, newPassword) => {
        set({ loading: true });
        const user = auth.currentUser;
        if (!user || !user.email) {
            const errorMsg = "Geen gebruiker gevonden om wachtwoord bij te werken.";
            toast.error(errorMsg);
            set({ error: errorMsg, loading: false });
            throw new Error(errorMsg);
        }

        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
          await fbUpdatePassword(user, newPassword);
          toast.success("Je wachtwoord is succesvol gewijzigd.");
          set({ loading: false });
        } catch (error: any) {
          console.error("Password update error:", error);
          const errorMsg = error.code === 'auth/wrong-password' 
            ? "Het huidige wachtwoord is niet correct." 
            : "Er is een fout opgetreden bij het wijzigen van je wachtwoord.";
          toast.error(errorMsg);
          set({ error: errorMsg, loading: false });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          await setPersistence(auth, browserLocalPersistence);
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          const idToken = await userCredential.user.getIdToken();
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          const ref = doc(db, 'users', userCredential.user.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) throw new Error("User profile not found in Firestore.");

          const userProfile = snap.data() as UserProfile;

          set({ currentUser: userProfile, loading: false });
          toast.success(`Welkom terug, ${userProfile.firstName}!`);
          
          await get().loadWishlists();
          await get().loadEvents();

          return userProfile;

        } catch (err: any) {
          console.error('[Login Error]', err);
          const msg = 'Incorrect email or password.';
          toast.error(msg);
          set({ error: msg, loading: false, currentUser: null, wishlists: [], events: [] });
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
          set({ currentUser: null, wishlists: [], events: [], error: null, loading: false });
          toast.info("Je bent nu uitgelogd.");
        }
      },
    }),
    {
      name: 'wish2share-auth-storage',
      partialize: (state) => ({ currentUser: state.currentUser }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAuthModal = () => {
  const { authModal, setAuthModalState, currentUser } = useAuthStore();
  
  const showLogin = () => setAuthModalState({ open: true, view: 'login' });
  const showRegister = () => setAuthModalState({ open: true, view: 'register' });
  const closeModal = () => setAuthModalState({ open: false });

  return { ...authModal, showLogin, showRegister, closeModal, isLoggedIn: !!currentUser };
};