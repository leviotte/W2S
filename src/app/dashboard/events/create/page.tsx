// src/app/dashboard/events/create/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getUserSubProfilesAction } from '@/lib/server/actions/subprofile-actions';
import CreateEventForm from './_components/CreateEventForm';
import type { EventProfileOption } from '@/types/event';

export const metadata = {
  title: 'Nieuw Evenement Aanmaken | Wish2Share',
  description: 'Maak een nieuw evenement aan en nodig vrienden uit',
};

export default async function CreateEventPage() {
  // ✅ STATE-OF-THE-ART: Eén call voor volledige user data
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/?modal=login&callbackUrl=/dashboard/events/create');
  }

  // ✅ Nu werkt dit! currentUser heeft firstName, lastName, etc.
  const subProfilesResult = await getUserSubProfilesAction();
  const subProfiles = subProfilesResult.success ? subProfilesResult.data || [] : [];

  // ✅ TYPE-SAFE MAPPING: Combineer main + sub profiles
  const allProfiles: EventProfileOption[] = [
    // Main profile (jijzelf)
    {
      id: currentUser.id,
      firstName: currentUser.firstName, // ✅ Nu beschikbaar!
      lastName: currentUser.lastName,   // ✅ Nu beschikbaar!
      displayName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`,
      photoURL: currentUser.photoURL || null,
      isMainProfile: true,
    },
    // Sub-profiles (kinderen/anderen)
    ...subProfiles.map(p => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      displayName: p.displayName || `${p.firstName} ${p.lastName}`,
      photoURL: p.photoURL || null,
      isMainProfile: false,
    })),
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nieuw Evenement Aanmaken
        </h1>
        <p className="text-gray-600">
          Organiseer een evenement, trek lootjes of maak een Secret Santa
        </p>
      </div>
      
      <CreateEventForm currentUser={currentUser} profiles={allProfiles} />
    </div>
  );
}