// src/app/profile/[username]/page.tsx

import { notFound } from 'next/navigation';
import { getUserProfileByUsername } from '@/lib/server/data/users';
import { getUserProfileAction } from '@/lib/server/actions/user-actions';
import { getSubProfileById } from '@/lib/server/data/profiles'; // ✅ ADDED
import { getUserWishlistsAction } from '@/lib/server/actions/wishlist';
import { getCurrentUser } from '@/lib/auth/actions';
import { UserAvatar } from '@/components/shared/user-avatar';
import FollowButton from '@/components/followers/FollowButton';
import FollowersFollowingCount from '@/components/followers/FollowersFollowingCount';
import WishlistsSection from '@/components/wishlist/WishlistsSection';
import { Card, CardContent } from '@/components/ui/card';

export const revalidate = 60;

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

let profileData = await getUserProfileByUsername(username);
let isSubProfile = false;

if (!profileData) {
  const subProfile = await getSubProfileById(username);

  if (subProfile) {
    profileData = {
      id: subProfile.id,
      userId: subProfile.userId,
      firstName: subProfile.firstName,
      lastName: subProfile.lastName,
      displayName: subProfile.displayName,
      photoURL: subProfile.photoURL,
      isPublic: subProfile.isPublic,
      gender: subProfile.gender,
      birthdate: subProfile.birthdate,
      createdAt: subProfile.createdAt,
      updatedAt: subProfile.updatedAt,
      username: null,
      email: null,
    } as any;

    isSubProfile = true;
  }
}

if (!profileData) {
  notFound();
}

  const viewer = await getCurrentUser();
  const viewerId = viewer?.id ?? null;
  const isOwnProfile = isSubProfile 
    ? viewerId === profileData.userId  // Voor sub-profiles, check tegen userId (de manager)
    : viewerId === profileData.id;     // Voor users, check tegen profile id

  if (!isOwnProfile && !profileData.isPublic) {
    return (
      <div className="container mx-auto max-w-4xl p-4 text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Privé Profiel
        </h1>
        <p className="text-gray-600">
          Dit profiel is niet publiek zichtbaar.
        </p>
      </div>
    );
  }

  // ✅ Voor sub-profiles, gebruik de userId om wishlists op te halen
  const wishlistOwnerId = isSubProfile ? profileData.id : profileData.id;
  const wishlistsResult = await getUserWishlistsAction(wishlistOwnerId);
  const wishlists = wishlistsResult.success && wishlistsResult.data ? wishlistsResult.data : [];

  const wishlistsRecord = wishlists.reduce<Record<string, (typeof wishlists)[number]>>((acc, w) => {
    acc[w.id] = w;
    return acc;
  }, {});

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="overflow-hidden">
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/10" />
        
        <CardContent className="p-4 sm:p-6">
          <div className="relative flex flex-col items-center sm:flex-row sm:items-end -mt-16 sm:-mt-20">
            <UserAvatar
              photoURL={profileData.photoURL}
              firstName={profileData.firstName}
              lastName={profileData.lastName}
              name={profileData.displayName}
              size="xl"
              className="h-24 w-24 md:h-32 md:w-32 border-4 border-card"
            />
            
            <div className="mt-4 sm:ml-6 flex-grow text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold">{profileData.displayName}</h1>
                {isSubProfile && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Beheerd Profiel
                  </span>
                )}
              </div>
              {profileData.username && (
                <p className="text-sm text-muted-foreground">@{profileData.username}</p>
              )}
            </div>
            
            <div className="mt-4 sm:mt-0">
              {!isOwnProfile && viewerId && !isSubProfile && (
                <FollowButton
                  currentUserId={viewerId}
                  targetId={profileData.id}
                />
              )}
            </div>
          </div>
          
          {!isSubProfile && (
            <div className="mt-6 flex justify-center sm:justify-start">
              <FollowersFollowingCount 
                userId={profileData.id} 
                isTargetProfile={!isOwnProfile}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <WishlistsSection 
          wishlists={wishlistsRecord}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  );
}