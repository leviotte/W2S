import { adminAuth, adminDb, adminStorage } from '@/lib/server/firebaseAdmin';
import { getAuthenticatedUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { SocialAccountsForm } from './_components/social-accounts-form';
import { Suspense } from 'react';

// Functie om de profielgegevens op te halen
async function getUserSocials(uid: string) {
  const { db } = adminAuth, adminDb, adminStorage();
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    return {};
  }
  const userData = userDoc.data();
  return userData?.socials || {};
}

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login'); // Of waar je on-geauteerde gebruikers heen stuurt
  }

  // Haal de data op de server op
  const socials = await getUserSocials(user.uid);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Instellingen</h1>
      <div className="grid gap-8">
        {/* We geven de server-data als prop aan het client component */}
        <Suspense fallback={<div>Laden...</div>}>
            <SocialAccountsForm socials={socials} />
        </Suspense>
        {/* Hier kunnen in de toekomst andere instellingen kaarten komen,
            zoals wachtwoord wijzigen, notificaties, etc. */}
      </div>
    </div>
  );
}