import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getUserProfileAction } from '@/lib/server/actions/user-actions';
import { ProfileClient } from './_components/profile-client'; // ✅ FIXED: Kleine letters

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/?modal=login&callbackUrl=/dashboard/profile');
  }

  const fullProfile = await getUserProfileAction(currentUser.id);

  if (!fullProfile) {
    redirect('/');
  }

  return <ProfileClient profile={fullProfile} />;
}