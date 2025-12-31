// src/components/auth/login-form.server.tsx
'use server';

import { z } from 'zod';
import { completeLoginAction } from '@/lib/server/actions/auth';

export const loginFormSchema = z.object({
  idToken: z.string().min(1, 'ID token ontbreekt'), // nu echte Firebase ID token
});

export async function LoginFormServer(data: unknown) {
  const validation = loginFormSchema.safeParse(data);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstError = fieldErrors.idToken?.[0] || 'Ongeldige invoer';
    return { success: false, error: firstError };
  }

  try {
    // completeLoginAction verwacht nu server-side een geldig Firebase ID token
    const result = await completeLoginAction(validation.data.idToken);
    return result; 
  } catch (err: any) {
    return { success: false, error: err.message || 'Login mislukt' };
  }
}
