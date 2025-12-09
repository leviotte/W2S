// src/lib/server/data/users.ts
import 'server-only'; // Zorgt ervoor dat dit nooit in een client component terechtkomt!
import { adminDb } from '@/lib/server/firebase-admin';
import { UserProfileSchema, type UserProfile } from '@/types/user';
import { WishlistSchema, type Wishlist } from '@/types/wishlist';
import { notFound } from 'next/navigation';
import { unstable_cache as cache } from 'next/cache';

// --- Profiel & Wishlist Functies ---

export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
    // ... (deze functie blijft zoals ze was)
  if (!userId) return null;
  try {
    const profileDoc = await adminDb.collection('profiles').doc(userId).get();
    if (!profileDoc.exists) return null;

    const parseResult = UserProfileSchema.safeParse({ id: profileDoc.id, ...profileDoc.data() });
    if (!parseResult.success) {
      console.error(`Ongeldige profiel data in Firestore voor ID ${userId}:`, parseResult.error);
      return null;
    }
    return parseResult.data;
  } catch (error) {
    console.error(`Fout bij het ophalen van profiel via ID ${userId}:`, error);
    return null;
  }
}

export async function getProfileByUsername(username: string): Promise<UserProfile> {
    // ... (deze functie blijft zoals ze was)
  if (!username) {
    notFound();
  }
  try {
    const querySnapshot = await adminDb.collection('profiles').where('username', '==', username).limit(1).get();

    if (querySnapshot.empty) {
      console.log(`Geen profiel gevonden voor username: ${username}`);
      notFound();
    }

    const profileDoc = querySnapshot.docs[0];
    const parseResult = UserProfileSchema.safeParse({ id: profileDoc.id, ...profileDoc.data() });

    if (!parseResult.success) {
      console.error(`Ongeldige profiel-data in DB voor username ${username}:`, parseResult.error);
      throw new Error('Kon profiel niet verwerken.');
    }
    return parseResult.data;
  } catch (error) {
    console.error(`Databasefout bij ophalen profiel voor username ${username}:`, error);
    notFound();
  }
}

export async function getUserWishlists(userId: string): Promise<Wishlist[]> {
    // ... (deze functie blijft zoals ze was)
  try {
    const snapshot = await adminDb.collection('wishlists').where('ownerId', '==', userId).where('isPublic', '==', true).get();
    if (snapshot.empty) return [];

    const wishlists: Wishlist[] = [];
    snapshot.forEach(doc => {
      const parseResult = WishlistSchema.safeParse({ id: doc.id, ...doc.data() });
      if (parseResult.success) {
        wishlists.push(parseResult.data);
      } else {
        console.warn(`[getUserWishlists] Ongeldige data voor wishlist ${doc.id}:`, parseResult.error.flatten());
      }
    });
    return wishlists;
  } catch (error) {
    console.error(`[getUserWishlists] Fout bij ophalen wishlists voor user ${userId}:`, error);
    return [];
  }
}

export async function getProfileManagers(profile: UserProfile): Promise<UserProfile[]> {
    // ... (deze functie blijft zoals ze was)
  const managerIds = profile.managers;
  if (!managerIds || managerIds.length === 0) {
    return [];
  }
  try {
    const managerRefs = managerIds.map((id: string) => adminDb.collection('profiles').doc(id));
    const managerDocs = await adminDb.getAll(...managerRefs);
    
    const managers: UserProfile[] = [];
    for (const doc of managerDocs) {
      if (doc.exists) {
        const parseResult = UserProfileSchema.safeParse({ id: doc.id, ...doc.data() });
        if (parseResult.success) {
          managers.push(parseResult.data);
        }
      }
    }
    return managers;
  } catch(error) {
    console.error(`Fout bij ophalen managers voor profiel ${profile.id}:`, error);
    return [];
  }
}

// --- NIEUW TOEGEVOEGD (en gecached!) ---

export type FollowStats = {
  followers: number;
  following: number;
};

export const getFollowCounts = cache(
  async (userId: string): Promise<FollowStats> => {
    try {
      if (!userId) return { followers: 0, following: 0 };

      // Firestore subcollections voor volgers/volgend bestaan op het 'profiles' document.
      const userProfileRef = adminDb.collection('profiles').doc(userId);

      const [followersSnapshot, followingSnapshot] = await Promise.all([
        userProfileRef.collection('followers').count().get(),
        userProfileRef.collection('following').count().get(),
      ]);

      return {
        followers: followersSnapshot.data().count,
        following: followingSnapshot.data().count,
      };
    } catch (error) {
      console.error(`❌ Error fetching follow counts for user ${userId}:`, error);
      return { followers: 0, following: 0 };
    }
  },
  ['follow-counts'], // Base cache key
  { revalidate: 3600, tags: ['follows'] } // Revalidate elke uur, tag voor on-demand revalidatie
);