// src/components/auth/register-form.server.tsx
'use server';

import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { ensureUserProfileAction, getUserByEmail } from '@/lib/server/actions/user-actions';

const schema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string().min(6), // verplicht bij credentials provider
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  location: z.string().optional(),
});

export async function RegisterFormServer(data: unknown) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Ongeldige registratie data' };
  }

  const { email, firstName, lastName, password } = parsed.data;

  // 🔹 Check of user al bestaat
  let user = await getUserByEmail(email);

  // 🔹 Als user niet bestaat → maak profiel aan
  if (!user) {
    const profile = await ensureUserProfileAction({
      uid: crypto.randomUUID(),
      email,
      displayName: `${firstName} ${lastName}`,
      photoURL: null,
    });

    user = {
      id: profile.id,
      email: profile.email,
      name: profile.displayName ?? `${firstName} ${lastName}`, // fallback voor name
      role: 'user',
      password, // plaintext, kan later gehasht worden
    };
  }

  // 🔹 TS-safe check: user mag hier nu nooit null zijn
  if (!user) {
    return { success: false, error: 'Registratie mislukt' };
  }

  // 🔹 Log de gebruiker in via NextAuth credentials provider
  const result = await signIn('credentials', {
    redirect: false,
    email: user.email,
    password: user.password,
  });

  if (!result?.ok) return { success: false, error: 'Inloggen mislukt na registratie' };

  return { success: true, user };
}
