/**
 * src/lib/server/firebaseAdmin.ts
 *
 * "GOLD STANDARD" SINGLETON PROVIDER voor de Firebase Admin SDK.
 *
 * Deze implementatie gebruikt de 'globalThis' caching strategie om stabiliteit
 * te garanderen tijdens hot-reloading in de Next.js development-omgeving.
 *
 * Het exporteert de geïnitialiseerde services direct voor eenvoudig gebruik.
 */
import 'server-only';
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Storage } from 'firebase-admin/storage';

// Definieer een type voor onze globale cache.
// Dit voorkomt dat we 'any' moeten gebruiken voor de global.
declare global {
  var _firebaseAdminServices: {
    app: App;
    auth: Auth;
    db: Firestore;
    storage: Storage;
  } | undefined;
}

// Lees de service account credentials uit de environment variables.
// Aangepast naar de naam die we in .env.local gebruiken voor consistentie.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  throw new Error(
    '[Firebase Admin] Fatal Error: De environment variable FIREBASE_SERVICE_ACCOUNT_JSON is niet ingesteld.'
  );
}

// Haal de Storage Bucket naam op. Essentieel voor file uploads.
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
    throw new Error(
    '[Firebase Admin] Fatal Error: De environment variable NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is niet ingesteld.'
  );
}

let services = globalThis._firebaseAdminServices;

if (!services) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const app = admin.apps.length
      ? admin.apps[0]!
      : admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: storageBucket, // Belangrijk voor file storage!
        });

    console.log('🔥 Firebase Admin SDK succesvol geïnitialiseerd.');

    services = {
      app,
      auth: admin.auth(app),
      db: admin.firestore(app),
      storage: admin.storage(app),
    };
    
    globalThis._firebaseAdminServices = services;

  } catch (e: any) {
    throw new Error(`[Firebase Admin] Initialisatie mislukt: ${e.message}`);
  }
}

export const adminApp = services.app;
export const adminAuth = services.auth;
export const adminDb = services.db;
export const adminStorage = services.storage;