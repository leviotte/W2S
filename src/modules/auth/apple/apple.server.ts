// src/lib/server/apple-auth.ts
'use server';

import { signIn } from 'next-auth/react';

/**
 * Apple login via NextAuth
 * Single source of truth: auth.js / authOptions
 */
export const appleSignInServer = {
  /**
   * Start Apple login
   * Valt volledig terug op NextAuth Apple-provider
   */
  async signIn(): Promise<void> {
    try {
      await signIn('apple', {
        callbackUrl: '/dashboard', // fallback na succesvolle login
      });
    } catch (err: any) {
      console.error('[Apple Login] Fout bij aanmelden:', err);
      throw new Error(err?.message || 'Apple login mislukt');
    }
  },
};
