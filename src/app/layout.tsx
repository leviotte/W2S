// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Providers en Globale Componenten
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { AuthModalManager } from '@/components/auth/auth-modal-manager'; // ✅ CORRECT
import { Toaster } from 'sonner';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wish2Share - Deel je wensen, deel geluk',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
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
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col bg-background">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            
            {/* Globale componenten */}
            <Toaster richColors position="top-center" />
            <AuthModalManager /> {/* ✅ CORRECT - Renders Login/Register modals */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}