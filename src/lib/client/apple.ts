// src/lib/client/apple.ts
'use client';

import { signIn } from 'next-auth/react';

/**
 * Apple login via NextAuth
 * Zorgt dat we één centrale auth flow hebben (auth.js)
 */
export const appleSignInClient = {
  /**
   * Start Apple login
   * @returns Promise<void>
   */
  async signIn(): Promise<void> {
    // NextAuth regelt redirect en token
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
