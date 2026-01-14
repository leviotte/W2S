// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { getSession } from '@/lib/auth/session.server';
import type { AuthenticatedSessionUser } from '@/types/session';
import type { UserProfile } from '@/types/user';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wish2Share - Deel je wensen, deel geluk',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
};

/* ============================================================================
 * HELPER: Session → UserProfile
 * ========================================================================== */
const mapSessionToUserProfile = (user: AuthenticatedSessionUser | null): UserProfile | null => {
  if (!user) return null;

  return {
    id: user.id,
    userId: user.id,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email,
    address: null,
    isPublic: false,
    isAdmin: user.isAdmin ?? false,
    isPartner: user.isPartner ?? false,
    sharedWith: [],
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: user.lastActivity ? new Date(user.lastActivity) : new Date(),
    displayName: user.displayName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    photoURL: user.photoURL ?? null,
    birthdate: null,
    gender: null,
    username: user.username ?? null,
    phone: null,
    socials: null,
  };
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔹 Haal session op van server
  const { user: sessionUser } = await getSession();

  // 🔹 Map session → UserProfile zodat Navbar types kloppen
  const currentUser = mapSessionToUserProfile(sessionUser);

  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col bg-background">
            <Navbar serverUser={currentUser} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
