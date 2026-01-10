// src/modules/profiles/profiles.server.ts
import { adminDb } from "@/lib/server/firebase-admin";

export interface ProfileDTO {
  id: string;
  name: string;
  avatarURL?: string;
}

export async function getProfilesForUser(userId: string): Promise<ProfileDTO[]> {
  const db = adminDb;

  const snapshot = await db
    .collection("profiles")
    .where("createdBy", "==", userId)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || data.displayName || "Unknown",
      avatarURL: data.avatarURL || data.photoURL,
    };
  });
}
