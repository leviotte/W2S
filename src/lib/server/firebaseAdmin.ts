import * as admin from 'firebase-admin';

// Voorkom her-initialisatie in de 'hot-reload' omgeving van Next.js dev mode
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        // Vervang de private key newline karakters om correct geparsed te worden
        privateKey: process.env.FIREBASE_PRIVATE_key!.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK Initialized');
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };