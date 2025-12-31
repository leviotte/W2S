// src/components/auth/password-reset-form.server.tsx
'use server';

import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/server/actions/auth';

export const resetFormSchema = z.object({
  email: z.string().email({ message: 'Ongeldig e-mailadres' }),
});

export async function PasswordResetFormServer(data: unknown) {
  const validation = resetFormSchema.safeParse(data);

  if (!validation.success) {
    // Gebruik flatten() om veldfouten te krijgen
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstError = fieldErrors.email?.[0] || 'Ongeldige invoer';
    return { success: false, error: firstError };
  }

  try {
    await sendPasswordResetEmail(validation.data.email);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Reset mislukt' };
  }
}
