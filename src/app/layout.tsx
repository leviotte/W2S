/**
 * src/app/layout.tsx
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { auth as adminAuth } from 'firebase-admin';

import { adminAuth, adminDb, adminStorage } from '@/lib/server/firebaseAdmin';
import { UserProfile, userProfileSchema } from '@/types/user';
import './globals.css';

import { Toaster } from 'sonner';
import SiteHeader from '@/components/layout/site-header';
// Tijdelijk uitgeschakeld tot we de store opzetten:
// import StoreInitializer from '@/components/shared/store-initializer';
// import AuthListener from '@/components/store/auth-listener';
// import AuthModal from '@/components/auth/auth-modal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wish2Share - Jouw Wensen, Gedeeld',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
};

async function getCurrentUser(): Promise<UserProfile | null> {
  // CORRECTIE: De typo 'sessi' is hier verwijderd. Dit is nu de juiste syntax.
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const { auth, db } = adminAuth, adminDb, adminStorage();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    if (!decodedClaims.uid) return null;

    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();
    if (!userDoc.exists) return null;
    
    // Zod validatie garandeert type-veiligheid
    return userProfileSchema.parse({ id: userDoc.id, ...userDoc.data() });

  } catch (error) {
    console.error('Session cookie validation failed:', error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        {/* <StoreInitializer currentUser={currentUser} /> */}
        {/* <AuthListener /> */}
        {/* <AuthModal /> */}

        <div className="relative flex min-h-screen flex-col bg-background">
          <SiteHeader currentUser={currentUser} />
          <main className="flex-1">{children}</main>
          {/* <SiteFooter /> */}
        </div>

        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}