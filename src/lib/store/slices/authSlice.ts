// Improved auth slice for Next.js 16 (App Router, SSR-safe)
// Path suggestion: src/lib/state/authSlice.ts

import { StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile as fbUpdateProfile,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  updatePassword as fbUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/client/firebase";
import { toast } from "sonner";
import type { StoreState, UserProfile } from "@/types/global";

export interface AuthSlice {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    birthdate: string,
    slug: string,
    gender: string,
    location: string,
    country?: string,
    onSuccess?: (path: string) => void
  ) => Promise<void>;
  login: (
    email: string,
    password: string,
    onSuccess?: (path: string) => void
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  appleSignIn: () => Promise<void>;
  facebookSignIn: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> =
  persist(
    (set, get) => ({
      currentUser: null,
      loading: false,
      error: null,

      register: async (
        email,
        password,
        firstName,
        lastName,
        birthdate,
        slug,
        gender,
        location,
        country,
        onSuccess
      ) => {
        try {
          set({ loading: true, error: null });

          const userCredential = await createUserWithEmailAndPassword(auth, email, password);

          await fbUpdateProfile(userCredential.user, {
            displayName: `${firstName} ${lastName}`,
          });

          await sendEmailVerification(userCredential.user);

          const profile: UserProfile = {
            id: userCredential.user.uid,
            email,
            firstName,
            lastName,
            birthdate,
            slug,
            gender,
            address: {
              city: location,
              country: country || "",
            },
            notifications: { email: true },
            emailVerified: false,
            isAdmin: false,
            isPublic: true,
          };

          await setDoc(doc(db, "users", profile.id), {
            ...profile,
            firstName_lower: firstName.toLowerCase(),
            lastName_lower: lastName.toLowerCase(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          await auth.signOut();
          set({ currentUser: null });

          toast.success("A verification email has been sent.");
          onSuccess?.("/");
        } catch (err: any) {
          const msg =
            err.code === "auth/email-already-in-use"
              ? "Email already in use."
              : "Registration failed.";
          toast.error(msg);
          set({ error: msg });
        } finally {
          set({ loading: false });
        }
      },

      login: async (email, password, onSuccess) => {
        try {
          set({ loading: true, error: null });

          await setPersistence(auth, browserLocalPersistence);
          const userCredential = await signInWithEmailAndPassword(auth, email, password);

          const ref = doc(db, "users", userCredential.user.uid);
          const snap = await getDoc(ref);

          if (!snap.exists()) throw new Error("Profile not found.");

          const data = snap.data() as UserProfile;
          const adminList = ["leviotte@icloud.com", "deneyer.liesa@telenet.be"]; // efficient override
          const isAdmin = adminList.includes(email);

          if (isAdmin && !data.isAdmin) {
            await updateDoc(ref, { isAdmin: true });
          }

          const user: UserProfile = {
            ...data,
            id: userCredential.user.uid,
            isAdmin,
          };

          set({ currentUser: user });
          onSuccess?.(isAdmin ? "/admin-dashboard?tab=metrics" : "/dashboard");
        } catch (err: any) {
          const msg =
            err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
              ? "Incorrect email or password."
              : "Login failed.";
          toast.error(msg);
          set({ error: msg });
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        await auth.signOut();
        set({ currentUser: null });
      },

      updateUserProfile: async (data) => {
        const user = get().currentUser;
        if (!user) return;

        const ref = doc(db, "users", user.id);
        await updateDoc(ref, {
          ...data,
          updatedAt: Timestamp.now(),
        });

        set({ currentUser: { ...user, ...data } });
      },

      updatePassword: async (currentPassword, newPassword) => {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error("Not authenticated");

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await fbUpdatePassword(user, newPassword);
      },

      googleSignIn: async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      },

      appleSignIn: async () => {
        const provider = new OAuthProvider("apple.com");
        await signInWithPopup(auth, provider);
      },

      facebookSignIn: async () => {
        const provider = new FacebookAuthProvider();
        await signInWithPopup(auth, provider);
      },

      deleteAccount: async () => {
        const user = auth.currentUser;
        if (!user) return;

        await deleteDoc(doc(db, "users", user.uid));
        await user.delete();
        set({ currentUser: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  );
