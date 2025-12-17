// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Providers en Globale Componenten
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar'; // ✅ NIEUWE NAVBAR
import { AuthModalManager } from '@/components/auth/auth-modal-manager';
import { Toaster } from 'sonner';
import { Footer } from '@/components/layout/Footer';

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
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col bg-background">
              <Navbar /> {/* ✅ NIEUWE NAVBAR */}
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            
            {/* Globale componenten */}
            <Toaster richColors position="top-center" />
            <AuthModalManager />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}