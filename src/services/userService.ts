/**
 * src/services/userService.ts
 *
 * Centrale service voor alle businesslogica gerelateerd aan gebruikers.
 * Gebruikt Zod voor robuuste data-validatie bij het ophalen uit Firestore.
 */
import 'server-only';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { userProfileSchema, type UserProfile } from '@/types/user';
import { wishlistSchema, type Wishlist } from '@/types/wishlist';
import { notFound } from 'next/navigation';

async function findUserDoc(slug: string) {
  const normalizedSlug = slug.toLowerCase();

  // 1. Zoek in 'profiles' (nieuwe standaard)
  const profilesRef = adminDb.collection('profiles');
  const profileSnapshot = await profilesRef.where('name_lower', '==', normalizedSlug).limit(1).get();
  if (!profileSnapshot.empty) {
    return profileSnapshot.docs[0];
  }

  // 2. Fallback: Zoek in 'users' (oude data)
  const usersRef = adminDb.collection('users');
  const userSnapshot = await usersRef.where('slug', '==', normalizedSlug).limit(1).get();
  if (!userSnapshot.empty) {
    return userSnapshot.docs[0];
  }

  // 3. Niets gevonden
  return null;
}

/**
 * Haalt een gebruikersprofiel op en valideert de data met Zod.
 * @param slug De unieke slug (gebruikersnaam) van de gebruiker.
 * @returns Het gevalideerde UserProfile object.
 * @throws `notFound()` als de gebruiker niet wordt gevonden.
 * @throws Zod-error als de data in Firestore corrupt of onvolledig is.
 */
export async function getUserProfileBySlug(slug: string): Promise<UserProfile> {
  const userDoc = await findUserDoc(slug);

  if (!userDoc) {
    notFound();
  }

  const data = userDoc.data();
  
  // Voeg de document-ID toe en valideer het hele object.
  // Dit is veel veiliger dan 'as UserProfile'!
  const result = userProfileSchema.safeParse({
    uid: userDoc.id,
    ...data,
  });

  if (!result.success) {
    console.error(`[UserService] Corrupte profiel data voor UID ${userDoc.id}:`, result.error.issues);
    // In een productie-omgeving zou je hier een fout kunnen loggen naar een service als Sentry.
    // We gooien een notFound om geen half-geladen pagina te tonen.
    notFound();
  }

  return result.data;
}

/**
 * Haalt de openbare wenslijsten voor een specifieke gebruiker op en valideert ze.
 * @param userId De ID van de gebruiker.
 * @returns Een array van gevalideerde Wishlist objecten.
 */
export async function getPublicWishlistsByUserId(userId: string): Promise<Wishlist[]> {
    const wishlistsQuery = adminDb.collection('wishlists')
        .where('owner', '==', userId)
        .where('isPrivate', '==', false);
        
    const wishlistsSnap = await wishlistsQuery.get();

    if (wishlistsSnap.empty) {
        return [];
    }

    // Map en valideer elke wenslijst individueel.
    const validatedWishlists = wishlistsSnap.docs.map(doc => {
      const result = wishlistSchema.safeParse({
        id: doc.id,
        ...doc.data(),
      });
      // Log de fout als de data niet klopt, maar filter hem uit de resultaten.
      if (!result.success) {
        console.warn(`[UserService] Corrupte wenslijst data (ID: ${doc.id}) voor gebruiker ${userId}. Wordt overgeslagen.`);
        return null;
      }
      return result.data;
    }).filter((w): w is Wishlist => w !== null); // Verwijder alle 'null' waarden.

    return validatedWishlists;
}