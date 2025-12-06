'use server';

import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/server/firebaseAdmin';
import { userProfileSchema } from '@/types/user';
import { RegisterActionInput } from '@/lib/validators/auth';
// We importeren onze nieuwe, centrale functies!
import { createSessionCookie, clearSessionCookie } from '@/lib/server/auth';

/**
 * ---- REGISTER ACTION ----
 */
export async function registerAction(
  data: RegisterActionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { idToken, firstName, lastName } = data;
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    if (!email) throw new Error('E-mail niet aanwezig in token.');

    const newUserProfile = userProfileSchema.parse({
      id: uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      createdAt: new Date().toISOString(),
    });

    await adminDb.collection('users').doc(uid).set(newUserProfile);
    
    // GEBRUIK DE CENTRALE FUNCTIE
    await createSessionCookie(idToken);

    return { success: true };
    
  } catch (error: any) {
    console.error('Server Action (registerAction) Fout:', error.message);
    return { success: false, error: 'Er is een serverfout opgetreden bij het aanmaken van uw account.' };
  }
}

/**
 * ---- LOGIN ACTION ----
 */
export async function loginAction(idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // GEBRUIK DE CENTRALE FUNCTIE
    await createSessionCookie(idToken);
    return { success: true };

  } catch (error: any) {
    console.error('Server Action (loginAction) Fout:', error.message);
    return { success: false, error: 'Er is een serverfout opgetreden bij het inloggen.' };
  }
}

/**
 * ---- LOGOUT ACTION ----
 */
export async function logoutAction(): Promise<void> {
  // GEBRUIK DE CENTRALE FUNCTIE
  await clearSessionCookie();
  redirect('/'); 
}