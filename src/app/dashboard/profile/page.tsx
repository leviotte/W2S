// src/app/dashboard/profile/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import { getUserProfile } from '@/lib/firebase/server/profiles';
import { ProfileClient } from './_components/profile-client';

export const metadata = {
  title: 'Profiel | Wish2Share',
  description: 'Beheer je profiel instellingen',
};

export default async function ProfilePage() {
  // ------------------------------
  // GET SESSION VIA AUTH.JS
  // ------------------------------
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    redirect('/auth/login?redirect=/dashboard/profile');
  }

  // ------------------------------
  // FETCH PROFILE
  // ------------------------------
  const profile = await getUserProfile(user.id);
  if (!profile) {
    redirect('/dashboard/profile/create');
  }

  // managers ophalen gebeurt nu volledig via useProfileManagers hook in ProfileClient
  return <ProfileClient profile={profile} />;
}
