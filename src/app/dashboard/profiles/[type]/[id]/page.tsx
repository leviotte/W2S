// src/app/dashboard/profiles/[type]/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getSubProfileById } from '@/lib/server/data/profiles';
import { getUserById } from '@/lib/server/data/users';
import { getUserWishlistsAction } from '@/lib/server/actions/wishlist';
import { getCurrentUser } from '@/lib/auth/actions';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Card } from '@/components/ui/card';
import FollowButton from '@/components/shared/follow-button';
import { Cake, MapPin } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ tab?: string; subTab?: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { type, id } = await params;

  if (!['profile', 'user'].includes(type)) {
    notFound();
  }

  let profileData: any = null;
  let isSubProfile = false;

  if (type === 'profile') {
    const subProfile = await getSubProfileById(id);
    if (!subProfile) {
      notFound();
    }

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
      address: (subProfile as any).address || null,
      createdAt: subProfile.createdAt,
      updatedAt: subProfile.updatedAt,
    };

    isSubProfile = true;
  } else {
    const user = await getUserById(id);
    if (!user) {
      notFound();
    }

    profileData = {
      id: user.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isPublic: user.isPublic,
      gender: user.gender,
      birthdate: user.birthdate,
      address: user.address || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      username: user.username,
      email: user.email,
    };

    isSubProfile = false;
  }

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
              Privé Profiel
            </h1>
            <p className="text-gray-600">
              Dit profiel is niet publiek zichtbaar.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const wishlistOwnerId = profileData.id;
  const wishlistsResult = await getUserWishlistsAction(wishlistOwnerId);
  const wishlists =
    wishlistsResult.success && wishlistsResult.data
      ? wishlistsResult.data
      : [];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-4">
        {/* ✅ PROFILE CARD */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center text-center">
              {/* ✅ AVATAR */}
              <UserAvatar
                photoURL={profileData.photoURL}
                firstName={profileData.firstName}
                lastName={profileData.lastName}
                name={profileData.displayName}
                size="xl"
                className="h-32 w-32 sm:h-36 sm:w-36"
              />

              {/* ✅ NAME - warm-olive groen */}
              <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-warm-olive">
                {profileData.displayName}
              </h1>

              {/* ✅ BIRTHDATE + LOCATION - RODE/ROZE ICONS */}
              <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-700">
                {profileData.birthdate && (
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-red-400" />
                    <span>
                      {new Date(profileData.birthdate).toLocaleDateString(
                        'nl-BE',
                        {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        }
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

              {/* ✅ FOLLOW BUTTON - met FollowButton component */}
              {!isOwnProfile && viewerId && (
  <div className="mt-6">
    <FollowButton
      currentUserId={viewerId}
      targetId={profileData.id}
      isTargetProfile={isSubProfile}
      isCurrentUserProfile={false}
      variant="default"
      size="default"
    />
  </div>
)}
            </div>
          </div>
        </Card>

        {/* ✅ WISHLIST SECTION */}
        <div className="mt-10">
          <h2 className="text-base sm:text-lg font-semibold text-warm-olive mb-6">
            Openbare wishlist
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishlists
              .filter((w) => w.isPublic || isOwnProfile)
              .map((wishlist) => (
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
                      {wishlist.items?.length || 0} items
                    </p>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}