// src/app/dashboard/profiles/[type]/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Cake, MapPin } from 'lucide-react';

import { getSubProfileById } from '@/lib/server/data/profiles';
import { getUserById } from '@/lib/server/data/users';
import { getWishlistsByOwnerId } from '@/lib/server/actions/wishlist';
import { getCurrentUser } from '@/lib/auth/actions';

import { UserAvatar } from '@/components/shared/user-avatar';
import FollowButton from '@/components/shared/follow-button';
import { Card } from '@/components/ui/card';

export const revalidate = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Wishlist = {
  id: string;
  name: string;
  slug?: string | null;
  isPublic: boolean;
  items?: unknown[];
};

interface PageProps {
  params: {
    type: 'profile' | 'user';
    id: string;
  };
  searchParams?: {
    tab?: string;
    subTab?: string;
  };
}
type Address = {
  city?: string;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function ProfilePage({ params }: PageProps) {
  const { type, id } = params;

  if (!['profile', 'user'].includes(type)) {
    notFound();
  }

  let profileData: {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    displayName: string;
    photoURL?: string | null;
    isPublic: boolean;
    gender?: string | null;
    birthdate?: string | null;
    address?: { city?: string } | null;
    username?: string | null;
    email?: string | null;
  } | null = null;

  let isSubProfile = false;

  // -------------------------------------------------------------------------
  // Load profile
  // -------------------------------------------------------------------------
  if (type === 'profile') {
    const subProfile = await getSubProfileById(id);
    if (!subProfile) notFound();

    profileData = {
  id: subProfile.id,
  userId: subProfile.userId,
  firstName: subProfile.firstName,
  lastName: subProfile.lastName,
  displayName: subProfile.displayName,
  photoURL: subProfile.photoURL ?? null,
  isPublic: subProfile.isPublic,
  gender: subProfile.gender ?? null,
  birthdate: subProfile.birthdate ?? null,
  address:
    typeof (subProfile as { address?: unknown }).address === 'object' &&
    (subProfile as { address?: Address }).address !== null
      ? (subProfile as { address?: Address }).address
      : null,
};

    isSubProfile = true;
  } else {
    const user = await getUserById(id);
    if (!user) notFound();

    profileData = {
      id: user.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      photoURL: user.photoURL ?? null,
      isPublic: user.isPublic,
      gender: user.gender ?? null,
      birthdate: user.birthdate ?? null,
      address: user.address ?? null,
      username: user.username ?? null,
      email: user.email ?? null,
    };

    isSubProfile = false;
  }

  if (!profileData) notFound();

  // -------------------------------------------------------------------------
  // Viewer & access control
  // -------------------------------------------------------------------------
  const viewer = await getCurrentUser();
  const viewerId = viewer?.id ?? null;

  const isOwnProfile = isSubProfile
    ? viewerId === profileData.userId
    : viewerId === profileData.id;

  if (!isOwnProfile && !profileData.isPublic) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <Card className="p-12 bg-white">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Privé profiel
            </h1>
            <p className="text-gray-600">
              Dit profiel is niet publiek zichtbaar.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Wishlists
  // -------------------------------------------------------------------------
  const wishlistsResult = await getWishlistsByOwnerId(profileData.id);

  const wishlists: Wishlist[] =
    wishlistsResult.success === true
      ? wishlistsResult.data.map((w) => ({
          id: w.id,
          name: w.name,
          slug: w.slug ?? null,
          isPublic: w.isPublic,
          items: w.items,
        }))
      : [];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-4">
        {/* PROFILE CARD */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center text-center">
              <UserAvatar
                photoURL={profileData.photoURL}
                firstName={profileData.firstName}
                lastName={profileData.lastName}
                name={profileData.displayName}
                size="xl"
                className="h-32 w-32 sm:h-36 sm:w-36"
              />

              <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-warm-olive">
                {profileData.displayName}
              </h1>

              <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-700">
                {profileData.birthdate && (
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-red-400" />
                    <span>
                      {new Date(profileData.birthdate).toLocaleDateString(
                        'nl-BE',
                        { day: '2-digit', month: '2-digit', year: 'numeric' }
                      )}
                    </span>
                  </div>
                )}

                {profileData.address?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>{profileData.address.city}</span>
                  </div>
                )}
              </div>

              {!isOwnProfile && viewerId && (
                <div className="mt-6">
                  <FollowButton
                    currentUserId={viewerId}
                    targetId={profileData.id}
                    isTargetProfile={isSubProfile}
                    isCurrentUserProfile={false}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* WISHLISTS */}
        <div className="mt-10">
          <h2 className="text-base sm:text-lg font-semibold text-warm-olive mb-6">
            Openbare wishlists
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishlists
              .filter((w) => w.isPublic || isOwnProfile)
              .map((wishlist) =>
                wishlist.slug ? (
                  <Link
                    key={wishlist.id}
                    href={`/wishlist/${wishlist.slug}`}
                    className="block"
                  >
                    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-lg p-5 cursor-pointer">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">
                        {wishlist.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {wishlist.items?.length ?? 0} items
                      </p>
                    </Card>
                  </Link>
                ) : null
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
