// app/api/tools/backfill-profiles/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db, auth } from "@/lib/server/firebaseAdmin";

const BACKFILL_SECRET = process.env.BACKFILL_SECRET || process.env.ADMIN_API_KEY;

export async function POST(req: NextRequest) {
  // protect this endpoint: require a secret header
  const headerSecret = req.headers.get("x-backfill-secret") || req.headers.get("authorization");
  if (!BACKFILL_SECRET || headerSecret !== BACKFILL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = initFirebaseAdmin();
    const profilesSnapshot = await db.collection("profiles").get();

    const updates: Array<Promise<FirebaseFirestore.WriteResult>> = [];
    profilesSnapshot.forEach((doc) => {
      const data = doc.data();
      const name: string = data.name || "";
      if (!data.name_lower) {
        updates.push(
          db.collection("profiles").doc(doc.id).update({
            name_lower: (name || "").toLowerCase(),
          })
        );
      }
    });

    await Promise.all(updates);
    return NextResponse.json({ ok: true, updated: updates.length });
  } catch (err) {
    console.error("Backfill failed:", err);
    return NextResponse.json({ error: "Backfill failed", details: String(err) }, { status: 500 });
  }
}
