// src/app/profile/[username]/page.tsx

import { notFound } from 'next/navigation';
import { Mail, MapPin, Cake } from 'lucide-react';
import Image from 'next/image';

import { getProfileByUsername, getUserWishlists } from '@/lib/server/data/users';
import { getCurrentUser } from '@/lib/auth/actions';

import { UserAvatar } from '@/components/shared/user-avatar';
import { FollowButton } from '@/components/followers/FollowButton';
import { FollowersFollowingCount } from '@/components/followers/FollowersFollowingCount';
import { WishlistsSection } from '@/components/wishlist/WishlistsSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Wishlist } from '@/types/wishlist'; // We moeten dit type nog aanmaken!

export const revalidate = 60; // Revalidate deze pagina elke 60 seconden

export default async function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;

  // 1. Haal de data parallel op voor maximale performance
  const [profileData, viewer] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  // Als het profiel niet bestaat, toon een 404 pagina
  if (!profileData) {
    notFound();
  }

  // 2. Haal de wishlists van dit profiel op
  // Deze functie moeten we nog maken in `lib/server/data/users.ts`
  const wishlists: Wishlist[] = await getUserWishlists(profileData.id);

  const viewerId = viewer?.id ?? '';
  const isOwnProfile = viewerId === profileData.id;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="overflow-hidden">
        <div className="relative h-32 md:h-48 bg-gray-200">
          {/* TO-DO: Implement profile banner image */}
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="relative flex flex-col items-center sm:flex-row sm:items-end -mt-16 sm:-mt-20">
            <UserAvatar
              src={profileData.photoURL}
              name={profileData.displayName}
              className="h-24 w-24 md:h-32 md:w-32 border-4 border-card"
            />
            <div className="mt-4 sm:ml-6 flex-grow text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profileData.displayName}</h1>
              {/* TO-DO: Logica voor birthdate en address, indien aanwezig in je nieuwe schema */}
            </div>
            <div className="mt-4 sm:mt-0">
              {!isOwnProfile && viewerId && (
                <FollowButton
                  viewerId={viewerId}
                  targetId={profileData.id}
                  // isTargetProfile is hier niet nodig als de logica in de component goed zit
                />
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-center sm:justify-start">
             <FollowersFollowingCount userId={profileData.id} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <WishlistsSection 
          wishlists={wishlists}
          isOwnProfile={isOwnProfile}
          // De user prop is hier niet nodig als we enkel wishlists tonen
        />
      </div>
    </div>
  );
}