// src/app/dashboard/profile/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session.server';
import { getUserProfile } from '@/lib/firebase/server/profiles';
import { ProfileClient } from './_components/profile-client';
import { SessionUser } from '@/types/session';

export const metadata = {
  title: 'Profiel | Wish2Share',
  description: 'Beheer je profiel instellingen',
};

export default async function ProfilePage() {
  const { user: sessionUser } = await getSession();

// Check of de user ingelogd is
if (!sessionUser) {
  redirect('/auth/login?redirect=/dashboard/profile');
}

// Nu weten we zeker dat user ingelogd is
const user = sessionUser;

  // id gebruiken i.p.v uid
  const profile = await getUserProfile(user.id);
  if (!profile) {
    redirect('/dashboard/profile/create');
  }

  // managers ophalen gebeurt nu volledig via useProfileManagers hook in ProfileClient
  return <ProfileClient profile={profile} />;
}
