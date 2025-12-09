import { getCurrentUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { SocialAccountsForm } from './_components/social-accounts-form';
import { adminDb } from '@/lib/server/firebase-admin';
import PageTitle from '@/components/layout/page-title';
import { PasswordChangeSection } from './_components/password-change-section'; // Importeren!
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Instellingen | Wish2Share',
  description: 'Beheer je profiel- en accountinstellingen.',
};

async function getUserSocials(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    return userDoc.exists ? userDoc.data()?.socials || {} : {};
  } catch (error) {
    console.error(`Kon socials niet laden voor gebruiker ${uid}:`, error);
    return {}; 
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/?auth=login'); // Stuur naar homepage met login modal
  }

  const socials = await getUserSocials(user.profile.id);

  return (
    <div className="space-y-8">
      <PageTitle title="Instellingen" description="Beheer hier de instellingen voor je account." />
      
      {/* Socials Formulier */}
      <SocialAccountsForm socials={socials} />
      
      <Separator />

      {/* Wachtwoord Wijzigen Sectie */}
      <PasswordChangeSection />

    </div>
  );
}