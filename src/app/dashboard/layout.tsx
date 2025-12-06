/**
 * src/app/dashboard/layout.tsx
 *
 * Dit is het 'gold standard' patroon voor het beveiligen van een hele route-sectie.
 * Als Server Component controleert het de authenticatie VOORDAT de pagina wordt gerenderd.
 */
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import AuthProvider from '@/components/providers/auth-provider';
import { Toaster } from 'sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Als er geen gebruiker is, stuur ONMIDDELLIijk door. Geen client-side flicker.
  if (!user) {
    // We gebruiken hier een 'callbackUrl' zodat we na het inloggen
    // de gebruiker terug kunnen sturen naar het dashboard.
    redirect('/?modal=login&callbackUrl=/dashboard');
  }

  // Als de gebruiker WEL is ingelogd, render de layout en geef de user-data door
  // via onze Client-Side Context Provider.
  return (
    <AuthProvider user={user}>
      {/* Hier kan een specifieke dashboard-sidebar of sub-navigatie komen */}
      <div className="container mx-auto p-4">
        {children}
      </div>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}