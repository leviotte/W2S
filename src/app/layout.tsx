// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Providers en Globale Componenten
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { SiteHeader } from '@/components/layout/site-header';
import AuthModal from '@/components/auth/auth-modal';
import { Toaster } from 'sonner';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wish2Share - Jouw Wensen, Gedeeld',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
  // ... je metadata blijft hetzelfde ...
};

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
          {/* AuthProvider is de nieuwe wrapper voor alles. 
              Hij regelt zelf de state, geen props nodig! */}
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