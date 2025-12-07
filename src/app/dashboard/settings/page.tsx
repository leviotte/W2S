import { getCurrentUser } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import { SocialAccountsForm } from './_components/social-accounts-form';
import { adminDb } from '@/lib/server/firebase-admin';

export const metadata = {
  title: 'Instellingen | Wish2Share',
  description: 'Beheer je profiel- en accountinstellingen.',
};

/**
 * Een robuuste, server-side functie om de social links voor een specifieke gebruiker op te halen.
 */
async function getUserSocials(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return {}; // Geen gebruiker gevonden, geef een leeg object terug.
    }
    // Geef de 'socials' map terug, of een leeg object als die niet bestaat.
    return userDoc.data()?.socials || {};
  } catch (error) {
    console.error(`Kon socials niet laden voor gebruiker ${uid}:`, error);
    return {}; // Voorkom een crash bij een database fout.
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Haal de data specifiek voor deze gebruiker op met onze nieuwe, cleane functie.
  const socials = await getUserSocials(user.id);

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Instellingen</h2>
        <p className="text-muted-foreground">
          Beheer hier de instellingen voor je account.
        </p>
      </div>
      
      {/* Geef de data direct door aan het formulier. */}
      <SocialAccountsForm socials={socials} />

      {/* Ruimte voor toekomstige instellingen (profiel, wachtwoord, etc.) */}
    </div>
  );
}