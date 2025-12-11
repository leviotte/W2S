'use server';

import { z } from 'zod';
import { createSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/server/firebase-admin';

const loginSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters zijn'),
  returnUrl: z.string().optional(),
});

export type LoginFormState = {
  success: boolean;
  message: string;
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};

export async function loginAction(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    returnUrl: formData.get('returnUrl'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validatie mislukt',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, returnUrl } = validatedFields.data;

  try {
    // OPMERKING: Firebase Admin SDK heeft GEEN signInWithEmailAndPassword
    // We moeten dit via client-side Firebase Auth doen
    // Deze action wordt aangeroepen NA client-side login met een idToken
    
    // Voor nu: Deze actie verwacht dat de client een Firebase ID token stuurt
    const idToken = formData.get('idToken') as string;
    
    if (!idToken) {
      return {
        success: false,
        message: 'Authenticatie token ontbreekt',
        errors: { _form: ['Geen token ontvangen'] },
      };
    }

    // Verifieer het token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Creëer session
    await createSession(decodedToken.uid);

    // Redirect wordt gedaan in de client component na success
    return {
      success: true,
      message: 'Login succesvol!',
    };

  } catch (error: any) {
    console.error('Login error:', error);
    
    return {
      success: false,
      message: 'Login mislukt. Controleer je gegevens.',
      errors: { _form: [error.message || 'Onbekende fout'] },
    };
  }
}