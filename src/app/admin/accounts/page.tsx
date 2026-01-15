// src/app/admin/accounts/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

export default async function AdminAccountsPage() {
  // Haal de huidige sessie op via NextAuth
  const session = await getServerSession(authOptions);

  const user = session?.user;

  // Redirect als gebruiker niet ingelogd is of geen admin
  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Beheer</h1>
        <p className="text-muted-foreground mt-2">
          Beheer gebruikersaccounts en permissies
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-900 mb-2">
          🚧 In ontwikkeling
        </h2>
        <p className="text-yellow-800">
          Account management interface komt binnenkort beschikbaar.
        </p>
      </div>
    </div>
  );
}
