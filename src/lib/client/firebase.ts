// src/lib/client/firebase.ts
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';

// ============================================================================
// FIREBASE CONFIG
// ============================================================================

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ============================================================================
// FIREBASE APP INITIALIZATION
// ============================================================================

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ============================================================================
// SERVICE INITIALIZATION (Lazy + Browser-Only)
// ============================================================================

let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _functions: Functions | null = null;

/**
 * Get Firebase Auth (browser only)
 */
export function getClientAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('[Firebase Client] getClientAuth() called on server');
  }

  if (!_auth) {
    _auth = getAuth(app);
    setPersistence(_auth, browserLocalPersistence).catch((err) => {
      console.warn('[Firebase Client] Auth persistence error:', err?.message ?? err);
    });
  }
  return _auth;
}

/**
 * Get Firestore (browser only)
 */
export function getClientFirestore(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('[Firebase Client] getClientFirestore() called on server');
  }

  if (!_db) {
    try {
      initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (err) {
      // Firestore already initialized - safe to ignore
    }
    _db = getFirestore(app);
  }
  return _db;
}

/**
 * Get Storage (browser only)
 */
export function getClientStorage(): FirebaseStorage {
  if (typeof window === 'undefined') {
    throw new Error('[Firebase Client] getClientStorage() called on server');
  }
  if (!_storage) {
    _storage = getStorage(app);
  }
  return _storage;
}

/**
 * Get Functions (browser only)
 */
export function getClientFunctions(): Functions {
  if (typeof window === 'undefined') {
    throw new Error('[Firebase Client] getClientFunctions() called on server');
  }
  if (!_functions) {
    _functions = getFunctions(app);
  }
  return _functions;
}

// ============================================================================
// CONVENIENCE EXPORTS (safe - will throw on server)
// ============================================================================

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