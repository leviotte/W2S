import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Providers en Globale Componenten
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { SiteHeader } from '@/components/layout/site-header';
import AuthModal from '@/components/auth/auth-modal';
import { Toaster } from 'sonner';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

// Je metadata blijft perfect zoals het is.
export const metadata: Metadata = {
  title: 'Wish2Share - Jouw Wensen, Gedeeld',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
  // Voeg hier eventuele andere metadata toe zoals openGraph, icons, etc.
};

/*
 * MENTOR'S OPMERKING: De structuur van deze RootLayout is de "gold standard".
 *
 * 1. ThemeProvider (buitenste): Omvat alles om themawissels correct te beheren.
 * 2. AuthProvider (binnenste): Omvat alle visuele componenten. Hij luistert naar de Firebase-auth
 *    en houdt onze Zustand-store up-to-date. Hij heeft geen props nodig.
 * 3. Sticky Footer Div: Je `flex min-h-screen flex-col` is de correcte manier om te zorgen
 *    dat je footer altijd onderaan staat, zelfs op korte pagina's.
 * 4. Globale Componenten (`Toaster`, `AuthModal`): Deze staan op het root-niveau binnen de providers
 *    zodat ze overal in de app aangeroepen kunnen worden. Perfect.
*/
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col bg-background">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            {/* Globale componenten die overal beschikbaar moeten zijn */}
            <Toaster richColors position="top-center" />
            <AuthModal />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}