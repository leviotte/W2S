import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { z } from "zod";

// ----------------------
// ZOD VALIDATION
// ----------------------
const SearchQuerySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
});

// ----------------------
// TYPE DEFINITIONS
// ----------------------
type AccountResult = {
  id: string;
  type: "account";
  firstName: string | null;
  lastName: string | null;
  name: string;
  email?: string;
  photoURL?: string;
  address?: { city?: string; country?: string };
  birthdate?: string;
  age?: number;
  gender?: string;
};

type ProfileResult = {
  id: string;
  type: "profile";
  name: string;
  photoURL?: string;
  address?: { city?: string; country?: string };
  birthdate?: string;
  age?: number;
  gender?: string;
};

type SearchResult = AccountResult | ProfileResult;

// ----------------------
// TYPE GUARDS
// ----------------------
function isAccount(item: SearchResult): item is AccountResult {
  return item.type === "account";
}

function isProfile(item: SearchResult): item is ProfileResult {
  return item.type === "profile";
}

// ----------------------
// AGE CALCULATOR
// ----------------------
function calculateAge(birthdate?: string): number | undefined {
  if (!birthdate) return undefined;
  const d = new Date(birthdate);
  if (isNaN(d.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

// ----------------------
// FIREBASE ADMIN INIT
// ----------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential:
      admin.credential.applicationDefault() ??
      admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
      ),
  });
}

const db = admin.firestore();

// ----------------------
// MAIN HANDLER
// ----------------------
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Validate input
    const parseResult = SearchQuerySchema.safeParse({
      firstName: url.searchParams.get("firstName")?.trim(),
      lastName: url.searchParams.get("lastName")?.trim(),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Missing or invalid firstName" },
        { status: 400 }
      );
    }

    const { firstName, lastName } = parseResult.data;

    const lowerFirst = firstName.toLowerCase();
    const lowerLast = lastName?.toLowerCase() ?? null;

    const results: SearchResult[] = [];

    // ----------------------
    // USERS COLLECTION
    // ----------------------
    try {
      const q = db
        .collection("users")
        .where("isPublic", "==", true)
        .orderBy("firstName_lower")
        .startAt(lowerFirst)
        .endAt(lowerFirst + "\uf8ff");

      const snap = await q.get();

      snap.forEach((doc) => {
        const d = doc.data();

        if (!d) return;

        // Optional last name filter
        if (lowerLast) {
          const match = (d.lastName ?? "").toLowerCase().startsWith(lowerLast);
          if (!match) return;
        }

        const first: string | null = d.firstName ?? null;
        const last: string | null = d.lastName ?? null;

        results.push({
          id: doc.id,
          type: "account",
          firstName: first,
          lastName: last,
          name: `${first ?? ""} ${last ?? ""}`.trim(),
          email: d.email,
          photoURL: d.photoURL,
          address: { city: d.address?.city, country: d.address?.country },
          birthdate: d.birthdate,
          age: calculateAge(d.birthdate),
          gender: d.gender,
        });
      });
    } catch (e) {
      console.error("User search error:", e);
    }

    // ----------------------
    // PROFILES COLLECTION
    // ----------------------
    try {
      const q = db
        .collection("profiles")
        .where("isPublic", "==", true)
        .orderBy("name_lower")
        .startAt(lowerFirst)
        .endAt(lowerFirst + "\uf8ff");

      const snap = await q.get();

      snap.forEach((doc) => {
        const d = doc.data();
        if (!d) return;

        if (lowerLast) {
          const match = (d.name ?? "").toLowerCase().includes(lowerLast);
          if (!match) return;
        }

        results.push({
          id: doc.id,
          type: "profile",
          name: d.name ?? "",
          photoURL: d.avatarURL,
          address: { city: d.address?.city, country: d.address?.country },
          birthdate: d.birthdate,
          age: calculateAge(d.birthdate),
          gender: d.gender,
        });
      });
    } catch (e) {
      console.error("Profile search error:", e);
    }

    // ----------------------
    // SORTING
    // ----------------------
    const sorted = results.sort((a, b) => {
      const aName = isAccount(a)
        ? `${a.firstName ?? ""} ${a.lastName ?? ""}`
        : a.name;
      const bName = isAccount(b)
        ? `${b.firstName ?? ""} ${b.lastName ?? ""}`
        : b.name;

      return aName.toLowerCase().localeCompare(bName.toLowerCase());
    });

    return NextResponse.json({ results: sorted }, { status: 200 });
  } catch (err) {
    console.error("Fatal search error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
