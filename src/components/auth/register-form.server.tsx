// src/components/auth/register-form.server.tsx
'use server';

import { z } from 'zod';
import { completeRegistrationAction } from '@/lib/server/actions/auth';

const schema = z.object({
  idToken: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  location: z.string().optional(),
});

export async function RegisterFormServer(data: unknown) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Ongeldige registratie data' };
  return completeRegistrationAction(parsed.data);
}
