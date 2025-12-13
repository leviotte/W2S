// src/lib/client/firebase.ts
// Client-side Firebase utilities for Next.js App Router
// NOTE: This file is intended to be imported from client components only.
// Server code should use lib/server/firebase-admin.ts instead.

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import type { FirebaseOptions } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFunctions, Functions } from "firebase/functions";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

// Initialize the Firebase *app* in a safe, idempotent way
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Exports that are only usable in the browser (guarded)
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _functions: Functions | null = null;

/**
 * Initialize and return Firebase Auth (browser only)
 */
export function getClientAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("getClientAuth() called on server. Import lib/firebase only from client code.");
  }

  if (!_auth) {
    _auth = getAuth(app);
    // Set persistent local storage once
    setPersistence(_auth, browserLocalPersistence).catch((err) => {
      // Non-fatal: log and continue
      console.warn("Auth persistence error:", err?.message ?? err);
    });
  }
  return _auth;
}

/**
 * Initialize and return Firestore (browser only).
 * We only enable persistentLocalCache in browser.
 */
export function getClientFirestore(): Firestore {
  if (typeof window === "undefined") {
    throw new Error("getClientFirestore() called on server. Use firebase-admin for server operations.");
  }

  if (!_db) {
    try {
      // initializeFirestore is idempotent for an already initialized app
      initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (err) {
      // If initializeFirestore throws because Firestore is already initialized, ignore.
      // We still want to call getFirestore.
      // console.warn("initializeFirestore:", err);
    }
    _db = getFirestore(app);
  }
  return _db;
}

/**
 * Storage (browser only)
 */
export function getClientStorage(): FirebaseStorage {
  if (typeof window === "undefined") {
    throw new Error("getClientStorage() called on server.");
  }
  if (!_storage) _storage = getStorage(app);
  return _storage;
}

/**
 * Functions (browser only)
 */
export function getClientFunctions(): Functions {
  if (typeof window === "undefined") {
    throw new Error("getClientFunctions() called on server.");
  }
  if (!_functions) _functions = getFunctions(app);
  return _functions;
}

// Convenience default exports (still safe — they will throw on server)
export const auth = (() => {
  try {
    return getClientAuth();
  } catch {
    return undefined as unknown as Auth;
  }
})();

export const db = (() => {
  try {
    return getClientFirestore();
  } catch {
    return undefined as unknown as Firestore;
  }
})();

export const storage = (() => {
  try {
    return getClientStorage();
  } catch {
    return undefined as unknown as FirebaseStorage;
  }
})();

export const functions = (() => {
  try {
    return getClientFunctions();
  } catch {
    return undefined as unknown as Functions;
  }
})();

export default app;
