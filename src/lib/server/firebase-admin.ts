/**
 * Firebase Admin SDK Initialisatie
 * 
 * GOLD STANDARD SINGLETON PROVIDER voor de Firebase Admin SDK.
 * 
 * Features:
 * - GlobalThis caching voor stabiliteit tijdens hot-reloading
 * - Robuuste private key parsing
 * - Volledige service exports (Auth, Firestore, Storage)
 * - Uitgebreide error handling
 * 
 * @see https://firebase.google.com/docs/admin/setup
 */
import 'server-only';
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Storage } from 'firebase-admin/storage';

// ============================================================================
// GLOBAL TYPE DEFINITIONS
// ============================================================================

declare global {
  var _firebaseAdminServices:
    | {
        app: App;
        auth: Auth;
        db: Firestore;
        storage: Storage;
      }
    | undefined;
}

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
] as const;

function validateEnvironment(): void {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `[Firebase Admin] Fatal Error: Ontbrekende environment variables: ${missing.join(', ')}`
    );
  }
}

// ============================================================================
// PRIVATE KEY PARSING
// ============================================================================

/**
 * Parse Firebase private key from environment variable
 * Handles multiple formats:
 * - Escaped newlines (\n)
 * - Actual newlines
 * - Quoted strings
 * - HTML entities (&quot;)
 */
function parsePrivateKey(key: string): string {
  if (!key) {
    throw new Error('Private key is empty');
  }

  try {
    let processedKey = key.trim();

    // Remove HTML entities if present
    processedKey = processedKey.replace(/&quot;/g, '"');

    // Remove surrounding quotes
    if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
      processedKey = processedKey.slice(1, -1);
    }
    if (processedKey.startsWith("'") && processedKey.endsWith("'")) {
      processedKey = processedKey.slice(1, -1);
    }

    // Replace literal \n with actual newlines
    processedKey = processedKey.replace(/\\n/g, '\n');

    // Validate PEM format
    if (!processedKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Key does not appear to be in PEM format');
    }

    if (!processedKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Key is incomplete or malformed');
    }

    return processedKey;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse private key: ${errorMsg}`);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeFirebaseAdmin() {
  // Return cached instance if available (hot-reload safety)
  if (globalThis._firebaseAdminServices) {
    console.log('[Firebase Admin] ♻️  Bestaande instance hergebruikt (cached)');
    return globalThis._firebaseAdminServices;
  }

  try {
    // Validate environment variables
    validateEnvironment();

    const projectId = process.env.FIREBASE_PROJECT_ID!;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY!;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;

    // Parse private key with robust error handling
    const privateKey = parsePrivateKey(privateKeyRaw);

    // Initialize Firebase Admin App
    const app = admin.apps.length
      ? admin.apps[0]!
      : admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
          storageBucket,
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });

    console.log(`[Firebase Admin] ✅ Geïnitialiseerd voor project: ${projectId}`);

    // Initialize all services
    const auth = admin.auth(app);
    const db = admin.firestore(app);
    const storage = admin.storage(app);

    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    // Cache services globally for hot-reload stability
    const services = { app, auth, db, storage };
    globalThis._firebaseAdminServices = services;

    return services;
  } catch (e: any) {
    console.error('[Firebase Admin] ❌ Initialisatie fout:', e.message);

    // Provide helpful error messages
    if (e.message.includes('PEM')) {
      console.error('\n[Firebase Admin] 💡 TIP: Check je .env.local file:');
      console.error('   FIREBASE_PRIVATE_KEY moet het formaat hebben:');
      console.error('   "-----BEGIN PRIVATE KEY-----\\nJOUW_KEY\\n-----END PRIVATE KEY-----\\n"');
      console.error('   Let op: gebruik letterlijke \\n (backslash + n), niet echte enters!\n');
    }

    throw new Error(`[Firebase Admin] Initialisatie mislukt: ${e.message}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Initialize once and cache globally
const { app: adminApp, auth: adminAuth, db: adminDb, storage: adminStorage } =
  initializeFirebaseAdmin();

// Export initialized services
export { adminApp, adminAuth, adminDb, adminStorage };

// Export admin SDK for additional functionality
export { admin };

// Export commonly used types
export type { App, Auth, Firestore, Storage };