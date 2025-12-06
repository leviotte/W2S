/**
 * src/app/layout.tsx
 *
 * De Root Layout voor de gehele applicatie.
 * Bevat globale stijlen, fonts, en de basis HTML-structuur.
 * Haalt de gebruiker op voor globale componenten zoals de header.
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getCurrentUser } from '@/lib/server/auth'; // MENTOR-VERBETERING: Gebruik de centrale functie!
import './globals.css';
import AuthModal from '@/components/auth/auth-modal';
import { Toaster } from 'sonner';
import SiteHeader from '@/components/layout/site-header';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wish2Share - Jouw Wensen, Gedeeld',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
  // MENTOR-TIP: Voeg Open Graph en andere meta-tags toe voor betere SEO.
  openGraph: {
    title: 'Wish2Share - Jouw Wensen, Gedeeld',
    description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
    url: 'https://wish2share.com',
    siteName: 'Wish2Share',
    images: [
      {
        url: 'https://wish2share.com/wish2share-og.jpg', // Zorg dat dit pad klopt!
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
  // Haal de gebruiker op via onze gecentraliseerde, robuuste server-functie.
  const currentUser = await getCurrentUser();

  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col bg-background">
            <SiteHeader currentUser={currentUser} />
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