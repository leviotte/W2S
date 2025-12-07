/**
 * src/app/dashboard/layout.tsx
 *
 * GOUDSTANDAARD PATROON: Hybride authenticatie.
 * 1. Server Component: Controleert de sessie VOOR het renderen. Onmiddellijke redirect als niet ingelogd.
 * 2. AuthProvider (Client Component): Hydrateert de client-side state (Zustand) met de user-data.
 */
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import AuthProvider from '@/components/providers/auth-provider'; // Onze nieuwe client-side brug
import { Toaster } from 'sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // SERVER-SIDE GATEKEEPER:
  // Als een niet-ingelogde gebruiker hier direct landt, wordt hij onmiddellijk
  // en zonder client-side flikkering weggestuurd.
  if (!user) {
    redirect('/?modal=login&callbackUrl=/dashboard');
  }

  // Als de gebruiker WEL is ingelogd, renderen we de client-side provider
  // en geven we de user-data door om de Zustand store te "hydrateren".
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