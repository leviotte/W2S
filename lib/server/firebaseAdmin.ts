import admin from 'firebase-admin';
import { App, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Haal de service account JSON op uit de environment variables.
// Dit is de VEILIGE manier.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountJson) {
  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_KEY is not defined in environment variables. Please add it to your .env.local file.'
  );
}

const serviceAccount = JSON.parse(serviceAccountJson);

// Initialiseer de Firebase Admin App. Controleer eerst of deze al bestaat.
// Dit voorkomt fouten tijdens hot-reloading in development.
const app: App = !getApps().length
  ? initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  : getApp();

// Exporteer de admin services die we gaan gebruiken in onze server components en API routes.
export const authAdmin = getAuth(app);
export const dbAdmin = getFirestore(app);