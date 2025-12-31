// src/components/auth/register-form.server.tsx
'use server';

import { z } from 'zod';
import { completeRegistrationAction } from '@/lib/server/actions/auth';

export const registerFormSchema = z.object({
  idToken: z.string().min(1, 'ID token ontbreekt'), // Firebase ID token van client
  firstName: z.string().min(2, 'Voornaam te kort'),
  lastName: z.string().min(2, 'Achternaam te kort'),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  location: z.string().optional(),
});

export async function RegisterFormServer(data: unknown) {
  const validation = registerFormSchema.safeParse(data);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstError =
      fieldErrors.idToken?.[0] ||
      fieldErrors.firstName?.[0] ||
      fieldErrors.lastName?.[0] ||
      'Ongeldige invoer';
    return { success: false, error: firstError };
  }

  try {
    const result = await completeRegistrationAction({
      idToken: validation.data.idToken, // echte Firebase ID token
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
      birthdate: validation.data.birthdate,
      gender: validation.data.gender,
      country: validation.data.country,
      location: validation.data.location,
    });

    return result; // { success: true, data: { userId, redirectTo } }
  } catch (err: any) {
    return { success: false, error: err.message || 'Registratie mislukt' };
  }
}
