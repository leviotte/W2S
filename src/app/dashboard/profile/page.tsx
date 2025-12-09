// src/app/dashboard/profile/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getProfileByUserId, getProfileManagers } from '@/lib/server/data/users'; 
import PageTitle from '@/components/layout/page-title';
import { Separator } from '@/components/ui/separator';

import PersonalInfoForm from './_components/personal-info-form';
import AddressForm from './_components/address-form';
import PublicStatusForm from './_components/public-status-form';
import PhotoForm from './_components/photo-form';
import { PasswordChangeSection } from '@/app/dashboard/settings/_components/password-change-section';
import { ShareProfileForm } from './_components/share-profile-form'; // <-- NIEUW

export const metadata = {
  title: 'Profiel Bewerken | Wish2Share',
};

async function getUserProfile(userId: string) {
    try {
        return await getProfileByUserId(userId);
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        return null;
    }
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/?auth=login');
  }

  const profileData = await getUserProfile(user.profile.id);
  if (!profileData) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <p>Kon profiel niet laden. Probeer het later opnieuw.</p>
        </div>
    );
  }

  // NIEUW: Haal de profielen op die dit profiel beheren.
  const managers = await getProfileManagers(profileData);

  return (
    <div className="space-y-8">
      <PageTitle title="Profiel Bewerken" description="Pas hier je account- en profielgegevens aan." />
      
      <PhotoForm profile={profileData} />
      <Separator />

      <PersonalInfoForm profile={profileData} />
      <Separator />
      
      <AddressForm profile={profileData} />
      <Separator />

      <PublicStatusForm profile={profileData} />
      <Separator />

      {/* NIEUW: De ShareProfileForm wordt nu gerenderd met de juiste data */}
      <ShareProfileForm initialManagers={managers} />
      <Separator />

      <PasswordChangeSection />
    </div>
  );
}