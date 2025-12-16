// src/app/dashboard/events/create/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getUserProfilesAction } from '@/lib/server/actions/profile-actions'; // ✅ FIXED IMPORT
import CreateEventForm from './_components/CreateEventForm';

export default async function CreateEventPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/?modal=login&callbackUrl=/dashboard/event/create');
  }

  // Get all profiles for the current user
  const profilesResult = await getUserProfilesAction(currentUser.id);
  const allProfiles = profilesResult.success ? profilesResult.data || [] : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nieuw Evenement Aanmaken</h1>
      <CreateEventForm currentUser={currentUser} profiles={allProfiles} />
    </div>
  );
}