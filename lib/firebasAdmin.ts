// lib/firebaseAdmin.ts
// Server-side Firebase Admin initialization for Next.js App Router (API routes / server functions)

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function loadServiceAccount(): Record<string, any> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_JSON env var. Provide the service account JSON string (single-line) in your environment."
    );
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON");
  }

  // Fix newline escape sequences if necessary
  if (json.private_key && typeof json.private_key === "string") {
    json.private_key = json.private_key.replace(/\\n/g, "\n");
  }

  return json;
}

/**
 * Initialize and return Admin Firestore.
 * Safe to call multiple times.
 */
export function initFirebaseAdmin(): Firestore {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const sa = loadServiceAccount();
  initializeApp({
    credential: cert(sa as any),
  });

  return getFirestore();
}

// Default convenience export
export default initFirebaseAdmin;
