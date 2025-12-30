// src/app/profile/[username]/page.tsx
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getUserProfileByUsername, getManagedProfiles } from '@/lib/server/data/users';
import WishlistsSection from '@/app/wishlist/_components/WishlistsSection';
import { UserAvatar } from '@/components/shared/user-avatar';
import FollowButton from '@/components/shared/follow-button';
import FollowersFollowingCount from '@/components/followers/FollowersFollowingCount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/actions';

interface ProfilePageProps {
  params: { username: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;

  // server fetch
  const userProfile = await getUserProfileByUsername(username);
  if (!userProfile) return notFound();

  const managedProfiles = await getManagedProfiles(userProfile.id);
  const allProfiles = [userProfile, ...managedProfiles];

  const wishlists: Record<string, any> = {};
  allProfiles.forEach((profile) => {
    wishlists[profile.id] = {
      id: profile.id,
      name: `${profile.displayName || profile.firstName}’s Wishlist`,
      description: `Een mooie wishlist van ${profile.displayName || profile.firstName}`,
      items: [],
      isPublic: true,
      slug: `wishlist-${profile.id}`,
    };
  });

  const currentUser = await getCurrentUser();
  const isOwnProfile = currentUser?.id === userProfile.id;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <UserAvatar profile={userProfile} size="xl" />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`}</h1>
            <Suspense fallback={<div>Laden...</div>}>
              <FollowersFollowingCount userId={userProfile.id} isTargetProfile />
            </Suspense>
          </div>
          <div className="ml-auto">
            {!isOwnProfile && (
              <FollowButton
                currentUserId={currentUser?.id || ''}
                targetId={userProfile.id}
                isTargetProfile
                isCurrentUserProfile={false}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<div>Laden...</div>}>
        <WishlistsSection wishlists={wishlists} isOwnProfile={isOwnProfile} />
      </Suspense>
    </div>
  );
}
