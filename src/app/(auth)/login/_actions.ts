// src/app/(auth)/login/_actions.ts
'use server';
import { completeLoginAction } from '@/lib/server/actions/auth';
import { redirect } from 'next/navigation';

export async function loginServerAction(idToken: string) {
  if (!idToken) throw new Error('Geen idToken ontvangen');

  const result = await completeLoginAction(idToken);

  // ✅ Safe redirect
  const redirectTo = result.data?.redirectTo || '/dashboard';

  if (!result.success) throw new Error(result.error || 'Login mislukt');

  redirect(redirectTo);
}
