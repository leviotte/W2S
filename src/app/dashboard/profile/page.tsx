import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/get-server-session';
import { getUserProfile, getProfileManagers } from '@/lib/firebase/server/profiles';
import { ProfileClient } from './_components/profile-client';
import { SessionUser } from '@/types/session';

export const metadata = {
  title: 'Profiel | Wish2Share',
  description: 'Beheer je profiel instellingen',
};

export default async function ProfilePage() {
  const session = await getServerSession();

  // Check of de user ingelogd is
  if (!session.user || !session.user.isLoggedIn) {
    redirect('/auth/login?redirect=/dashboard/profile');
  }

  // Nu weten we zeker dat user ingelogd is, cast naar ingelogde user
  const user = session.user as SessionUser & { isLoggedIn: true };

  // id gebruiken i.p.v uid
  const profile = await getUserProfile(user.id);
  if (!profile) {
    redirect('/dashboard/profile/create');
  }

  const managers = await getProfileManagers(user.id);

  return <ProfileClient profile={profile} managers={managers} />;
}
