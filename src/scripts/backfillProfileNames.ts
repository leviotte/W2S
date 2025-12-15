// src/scripts/backfillProfileNames.ts
/**
 * Database migration script: Backfill displayName fields
 * 
 * Vult 'displayName' en 'displayName_lower' velden in voor bestaande gebruikers.
 * Dit maakt case-insensitive zoeken mogelijk.
 * 
 * BELANGRIJK:
 * - Maak ALTIJD een Firestore backup voor je dit draait!
 * - Test eerst op een staging database
 * 
 * Usage:
 *   npm run db:backfill-names
 * 
 * Environment variables (automatisch geladen door Next.js):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

import { adminDb } from '../lib/server/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 500; // Firestore max batch size
const USERS_COLLECTION = 'users';
const DRY_RUN = process.env.DRY_RUN === 'true'; // Voor testing

// ============================================================================
// TYPES
// ============================================================================

interface UserData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  displayName_lower?: string;
}

// ============================================================================
// MAIN LOGIC
// ============================================================================

async function backfillDisplayNames() {
  console.log('🚀 Starting displayName backfill script...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be committed\n');
  }

  try {
    // Fetch all users
    const usersRef = adminDb.collection(USERS_COLLECTION);
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('✅ No users found in database.');
      return;
    }

    console.log(`📊 Found ${snapshot.size} users to process\n`);

    // Process in batches
    let batch = adminDb.batch();
    let batchCount = 0;
    let updateCount = 0;
    let skipCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data() as UserData;
      const userId = doc.id;

      // Generate displayName from firstName + lastName
      const firstName = (data.firstName || '').trim();
      const lastName = (data.lastName || '').trim();
      const displayName = `${firstName} ${lastName}`.trim() || 'Anonymous';
      const displayNameLower = displayName.toLowerCase();

      // Check if update is needed
      const needsUpdate =
        data.displayName !== displayName ||
        data.displayName_lower !== displayNameLower;

      if (!needsUpdate) {
        skipCount++;
        continue;
      }

      // Log planned update
      console.log(`➡️  User ${userId}: "${data.displayName || '(empty)'}" → "${displayName}"`);

      if (!DRY_RUN) {
        batch.update(doc.ref, {
          displayName,
          displayName_lower: displayNameLower,
          updatedAt: new Date().toISOString(),
        });
        batchCount++;
        updateCount++;

        // Commit batch when it reaches 500 operations
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`\n✅ Committed batch of ${batchCount} updates\n`);
          batch = adminDb.batch();
          batchCount = 0;
        }
      } else {
        updateCount++;
      }
    }

    // Commit remaining updates
    if (batchCount > 0 && !DRY_RUN) {
      await batch.commit();
      console.log(`\n✅ Committed final batch of ${batchCount} updates\n`);
    }

    // Summary
    console.log('─'.repeat(50));
    console.log('📈 SUMMARY');
    console.log('─'.repeat(50));
    console.log(`Total users:      ${snapshot.size}`);
    console.log(`Updates needed:   ${updateCount}`);
    console.log(`Already correct:  ${skipCount}`);
    console.log(`Mode:             ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (changes committed)'}`);
    console.log('─'.repeat(50));

    if (DRY_RUN) {
      console.log('\n💡 Run without DRY_RUN=true to apply changes');
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Error during backfill:', error);
    process.exitCode = 1;
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

// Run the script
backfillDisplayNames()
  .then(() => {
    console.log('\n✅ Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });