// src/lib/client/google.ts
'use client';

import { signIn } from 'next-auth/react';

/**
 * Google login via NextAuth
 * Één enkele source of truth: auth.js
 */
export const googleSignInClient = {
  /**
   * Start Google login
   */
  async signIn(): Promise<void> {
    try {
      await signIn('google', {
        callbackUrl: '/dashboard', // fallback na succesvolle login
      });
    } catch (err: any) {
      console.error('[Google Login] Fout bij aanmelden:', err);
      throw new Error(err?.message || 'Google login mislukt');
    }
  },
};
