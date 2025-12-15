// src/app/dashboard/settings/page.tsx
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import PageTitle from '@/components/layout/page-title';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import type { SocialLinks, UserProfile } from '@/types/user';

import { ProfileInfoForm } from './_components/profile-info-form';
import { SocialAccountsForm } from './_components/social-accounts-form';
import { PasswordChangeSection } from './_components/password-change-section';

export const metadata = {
  title: 'Instellingen | Wish2Share',
  description: 'Beheer je profiel- en accountinstellingen.',
};

async function getUserSettings(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return null;
    }
    const userData = userDoc.data() as UserProfile;
    return {
      profileInfo: {
        displayName: userData.displayName,
        username: userData.username,
        isPublic: userData.isPublic,
      },
      socials: userData.socials || null,
    };
  } catch (error) {
    console.error(`Kon instellingen niet laden voor gebruiker ${uid}:`, error);
    return null; 
  }
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/?auth=login');
  }

  const settings = await getUserSettings(session.user.id);
  
  if (!settings) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      <PageTitle 
        title="Instellingen" 
        description="Beheer hier de instellingen voor je profiel en account." 
      />
      
      {/* HIER IS DE CORRECTIE: De sectie is nu actief */}
      <ProfileInfoForm initialData={settings.profileInfo} />
      
      <Separator />

      <SocialAccountsForm initialData={settings.socials} />
      
      <Separator />

      <PasswordChangeSection />

    </div>
  );
}