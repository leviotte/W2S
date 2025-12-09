// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// DE BRUG TUSSEN SERVER EN CLIENT
import { getCurrentUser } from '@/lib/server/auth';
import StoreInitializer from '@/components/shared/store-initializer';

// JE BESTAANDE COMPONENTEN
import { ThemeProvider } from '@/components/providers/theme-provider';
import SiteHeader from '@/components/layout/site-header';
import AuthModal from '@/components/auth/auth-modal';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wish2Share - Jouw Wensen, Gedeeld',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
  openGraph: {
    title: 'Wish2Share - Jouw Wensen, Gedeeld',
    description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
    url: 'https://wish2share.com',
    siteName: 'Wish2Share',
    images: [
      {
        url: '/wish2share-og.jpg', // Standaard pad vanuit de 'public' map
        width: 1200,
        height: 630,
      },
    ],
    locale: 'nl_BE',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Haal de gebruiker op de SERVER op, net zoals je al deed.
  const user = await getCurrentUser();

  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 2. Hier is de magie: Initialiseer de client-store met de server-data. 
               We geven het MINIMALE user.profile door, ons "sessie-ticket". */}
        <StoreInitializer user={user?.profile || null} />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col bg-background">
            {/* 3. SiteHeader heeft nu GEEN prop meer nodig! 
                   Het kan de gebruiker zelf uit de store halen. */}
            <SiteHeader />
            <main className="flex-1">{children}</main>
            {/* <SiteFooter /> */}
          </div>
          <Toaster richColors position="top-center" />
          <AuthModal />
        </ThemeProvider>
      </body>
    </html>
  );
}