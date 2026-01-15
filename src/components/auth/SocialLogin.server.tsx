// src/components/auth/SocialLogin.server.ts
'use server';

import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { ensureUserProfileAction, getUserByEmail } from '@/lib/server/actions/user-actions';

interface Props {
  provider: 'google' | 'apple';
  idToken: string;
  email?: string;      // optioneel, kan bij Apple of Google meegeleverd worden
  name?: string;       // optioneel, displayName
  picture?: string;    // optioneel, profielfoto
}

export async function handleSocialLogin({ provider, idToken, email, name, picture }: Props) {
  try {
    if (!idToken) throw new Error('Geen token meegegeven');

    // 🔹 Als email niet is meegegeven, kan je hier eventueel token decoderen om email te halen
    if (!email) throw new Error('Geen e-mail beschikbaar van provider');

    // 🔹 Check of gebruiker al bestaat
    let user = await getUserByEmail(email);

    // 🔹 Als user niet bestaat → maak profiel aan
    if (!user) {
      const profile = await ensureUserProfileAction({
        uid: crypto.randomUUID(),
        email,
        displayName: name ?? email.split('@')[0],
        photoURL: picture ?? null,
      });

      user = {
        id: profile.id,
        email: profile.email,
        name: profile.displayName ?? email.split('@')[0], // fallback voor name
        role: 'user',
        password: '', // dummy password voor credentials provider
      };
    }

    // 🔹 TS-safe check: user kan hier niet null zijn
    if (!user) throw new Error('Gebruiker kon niet worden aangemaakt');

    // 🔹 Log de gebruiker in via NextAuth credentials provider
    const result = await signIn('credentials', {
      redirect: false,
      email: user.email,
      password: user.password || 'dummy', // fallback dummy password
    });

    if (!result?.ok) throw new Error(`Login met ${provider} mislukt`);

    toast.success(`${provider} login succesvol!`);
  } catch (err: any) {
    toast.error(err?.message || `${provider} login mislukt`);
  }
}
