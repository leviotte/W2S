// src/app/dashboard/profile/page.tsx
import { getAuthenticatedUserProfile } from '@/lib/auth/actions';
import { getProfileManagers } from '@/lib/server/data/users';
import { notFound } from 'next/navigation';

// Correcte imports voor default exports
import PersonalInfoForm from './_components/personal-info-form';
import PhotoForm from './_components/photo-form';
import AddressForm from './_components/address-form';
import ShareProfileForm from './_components/share-profile-form';

export default async function ProfilePage() {
  const profileData = await getAuthenticatedUserProfile();
  if (!profileData) {
    notFound();
  }

  const managers = await getProfileManagers(profileData.managers);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
           <PhotoForm profile={profileData} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <PersonalInfoForm profile={profileData} />
          <AddressForm profile={profileData} />
        </div>
      </div>
      <ShareProfileForm profile={profileData} managers={managers} />
    </div>
  );
}