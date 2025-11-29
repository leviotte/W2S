// lib/firebaseAdmin.ts
import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type ServiceAccount = {
  project_id?: string;
  private_key?: string;
  client_email?: string;
};

function getServiceAccountFromEnv(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (err) {
    // maybe it's a path to a file (legacy)
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const obj = require(raw);
      return obj;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
      return null;
    }
  }
}

export function initFirebaseAdmin() {
  if (getApps().length) {
    return getFirestore();
  }

  const sa = getServiceAccountFromEnv();
  if (!sa || !sa.private_key) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT not set or invalid. Set it in Vercel as a JSON string or point to a key file."
    );
  }

  // private_key may include literal \n so convert
  // @ts-ignore
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");

  initializeApp({
    credential: cert(sa as any),
  });

  return getFirestore();
}
