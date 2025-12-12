import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/get-server-session';
import { getUserProfile, getProfileManagers } from '@/lib/firebase/server/profiles';
import { ProfileClient } from './_components/profile-client';

export const metadata = {
  title: 'Profiel | Wish2Share',
  description: 'Beheer je profiel instellingen',
};

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session.user) {
    redirect('/auth/login?redirect=/dashboard/profile');
  }

  const profile = await getUserProfile(session.user.uid);

  if (!profile) {
    redirect('/dashboard/profile/create');
  }

  const managers = await getProfileManagers(session.user.uid);

  return <ProfileClient profile={profile} managers={managers} />;
}