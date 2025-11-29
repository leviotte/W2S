// lib/firebase.ts
// Client-side Firebase for Next.js App Router

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence 
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

// Prevent Next.js HMR duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// AUTH (with local persistence)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err =>
  console.error("Auth persistence error:", err.message)
);

// FIRESTORE (with offline persistence)
initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const db = getFirestore(app);

// STORAGE
export const storage = getStorage(app);

// FUNCTIONS (optional)
export const functions = getFunctions(app);
