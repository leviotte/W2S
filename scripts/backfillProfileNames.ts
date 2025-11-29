// scripts/backfillProfileNames.ts
/**
 * Run locally:
 *   node -r ts-node/register scripts/backfillProfileNames.ts
 *
 * Ensure FIREBASE_SERVICE_ACCOUNT env var is set (stringified JSON).
 */

import { initFirebaseAdmin } from "../lib/firebaseAdmin";

async function run() {
  try {
    const db = initFirebaseAdmin();
    const snapshot = await db.collection("profiles").get();
    const updates: Array<Promise<any>> = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const name = data.name || "";
      if (!data.name_lower) {
        updates.push(
          db.collection("profiles").doc(doc.id).update({
            name_lower: (name || "").toLowerCase(),
          })
        );
      }
    });
    await Promise.all(updates);
    console.log("Updated", updates.length, "profiles");
  } catch (err) {
    console.error("Backfill script failed:", err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}

export default run;
