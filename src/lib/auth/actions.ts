// src/lib/auth/actions.ts
'use server';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// AANPASSING: De importnamen zijn gecorrigeerd naar wat firebase-admin.ts daadwerkelijk exporteert.
import { adminAuth, adminDb } from '@/lib/server/firebase-admin';
import { sessionOptions, type SessionData } from '@/lib/server/session';
import { UserProfileSchema, type AuthedUser, type UserProfile } from '@/types/user';

// --- TYPE DEFINITIES --- //

type AuthActionResult = 
  | { success: true; user: AuthedUser }
  | { success: false; error: string };

// --- SERVER ACTIONS --- //

export async function createSessionAction(idToken: string): Promise<AuthActionResult> {
  try {
    // AANPASSING: Gebruik de direct geïmporteerde 'adminAuth' en 'adminDb'.
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      throw new Error('Gebruikersprofiel niet gevonden in Firestore. Probeer opnieuw te registreren.');
    }

    const userProfile = UserProfileSchema.parse({ id: userDoc.id, ...userDoc.data() });
    const authedUser: AuthedUser = { profile: userProfile };

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.user = authedUser;
    await session.save();
    console.log(`✅ Server session created for: ${userProfile.email}`);

    revalidatePath('/', 'layout');

    return { success: true, user: authedUser };
  } catch (error: any) {
    console.error('🚨 Create Session Action Error:', error);
    return { success: false, error: 'Sessie aanmaken mislukt: ' + error.message };
  }
}

const registerInputSchema = z.object({
  idToken: z.string(),
  firstName: z.string().min(1, 'Voornaam is verplicht.'),
  lastName: z.string().min(1, 'Achternaam is verplicht.'),
});

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  try {
    const { idToken, firstName, lastName } = registerInputSchema.parse(input);
    // AANPASSING: Gebruik de direct geïmporteerde 'adminAuth' en 'adminDb'.
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    if (!email) throw new Error("E-mail niet gevonden in Firebase token.");

    const newUserProfile: UserProfile = {
      id: uid,
      email: email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      photoURL: decodedToken.picture || null,
      isAdmin: false,
      isPublic: true,
      address: null,
      managers: [],
    };
    
    UserProfileSchema.parse(newUserProfile);

    // AANPASSING: Gebruik de direct geïmporteerde 'adminDb'.
    await adminDb.collection('users').doc(uid).set(newUserProfile);
    console.log(`✅ Firestore profile created for: ${email}`);
    
    // Hergebruik onze createSessionAction, die nu ook correct werkt.
    return await createSessionAction(idToken);

  } catch (error: any) {
    console.error('🚨 Register Action Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validatiefout: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { success: false, error: 'Account aanmaken mislukt: ' + error.message };
  }
}

export async function logoutAction() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  await session.destroy();
  redirect('/');
}