// src/lib/auth/actions.ts
'use server';

import { getSession, createSessionUser } from '@/lib/server/auth';
import { adminAuth, adminDb } from '@/lib/server/firebase-admin';
import { revalidatePath } from 'next/cache';
import { userProfileSchema } from '@/types'; // Importeren vanuit de hoofd-index

/**
 * ---- REGISTER ACTION ----
 */
export async function registerAction(idToken: string, firstName: string, lastName: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    if (!email) throw new Error('E-mail niet aanwezig in Firebase token.');

    // Creëer en valideer het nieuwe profiel
    const newUserProfile = userProfileSchema.parse({
      id: uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      createdAt: new Date().toISOString(),
      // Zorg voor default waarden
      isPublic: true,
      isAdmin: false,
      followers: [],
      following: [],
      managers: [],
    });

    await adminDb.collection('users').doc(uid).set(newUserProfile);

    // Creëer de sessie met het zojuist aangemaakte profiel
    const session = await getSession();
    session.user = newUserProfile;
    await session.save();
    
    revalidatePath('/', 'layout');
    return { success: true, user: newUserProfile };

  } catch (error: any) {
    console.error('[Register Action] Fout:', error.message);
    return { success: false, error: 'Account aanmaken is mislukt.' };
  }
}


/**
 * ---- LOGIN ACTION ----
 */
export async function loginAction(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userProfile = await createSessionUser(decodedToken.uid);

    const session = await getSession();
    session.user = userProfile;
    await session.save();

    revalidatePath('/', 'layout');
    return { success: true, user: userProfile };
  } catch (error: any) {
    console.error('[Login Action] Fout:', error.message);
    return { success: false, error: 'Authenticatie mislukt.' };
  }
}

/**
 * ---- LOGOUT ACTION ----
 */
export async function logoutAction() {
  try {
    const session = await getSession();
    session.destroy();

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('[Logout Action] Fout:', error.message);
    return { success: false, error: 'Uitloggen mislukt.' };
  }
}