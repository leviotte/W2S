import * as admin from 'firebase-admin';

// Definieer de vereiste environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

// Controleer of alle variabelen aanwezig zijn
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `[Firebase Admin] Fatal Error: Environment variable ${envVar} is not defined. Please check your .env.local file.`
    );
  }
}

// Singleton pattern: zorg ervoor dat we de app maar één keer initialiseren
let app: admin.app.App;

if (!admin.apps.length) {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        // De replace-logica is perfect, die behouden we
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK Initialized Successfully.');
  } catch (error: any) {
    console.error('[Firebase Admin] Initialization failed:', error);
    // Gooi de fout door zodat de server niet start met een foute configuratie
    throw new Error('Could not initialize Firebase Admin SDK.');
  }
} else {
  // Als er al een app is, gebruik die dan
  app = admin.app();
  console.log('Firebase Admin SDK already initialized.');
}

// Exporteer de services die je nodig hebt in de rest van je app
const auth = admin.auth(app);
const db = admin.firestore(app);

export { auth, db, admin };