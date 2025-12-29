// src/app/layout.tsx
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/actions';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Providers en Globale Componenten
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { AuthModalManager } from '@/components/auth/auth-modal-manager';
import { Toaster } from 'sonner';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wish2Share - Deel je wensen, deel geluk',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  // ✅ Read active profile from cookie
  const cookieStore = await cookies();
  const activeProfileId = cookieStore.get('activeProfile')?.value || 'main-account';

  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col bg-background">
              <Navbar serverUser={currentUser} /> {/* activeProfileId alleen toevoegen als NavbarProps dat ondersteunt */}
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster richColors position="top-center" />
            <AuthModalManager />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
