// src/app/layout.tsx
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/actions';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wish2Share - Deel je wensen, deel geluk',
  description: 'Deel eenvoudig je wenslijsten voor elke gelegenheid.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  const cookieStore = await cookies();
  const activeProfileId = cookieStore.get('activeProfile')?.value || 'main-account';

  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <div className="relative flex min-h-screen flex-col bg-background">
            <Navbar serverUser={currentUser} /> 
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster richColors position="top-center" />
          {/* Client-only modals */}
        </ThemeProvider>
      </body>
    </html>
  );
}
