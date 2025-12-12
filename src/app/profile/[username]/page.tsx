import { notFound } from 'next/navigation';
import { getUserProfileByUsername } from '@/lib/server/data/users';
import { getUserWishlistsAction } from '@/lib/server/actions/wishlist-actions';
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
  params: { username: string };
}) {
  const { username } = params;

  const [profileData, viewer] = await Promise.all([
    getUserProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profileData) {
    notFound();
  }

  const wishlistsResult = await getUserWishlistsAction(profileData.id);
  
  // ✅ FIXED: Single declaration
  const wishlists = wishlistsResult.success && wishlistsResult.data ? wishlistsResult.data : [];

  const viewerId = viewer?.id ?? null;
  const isOwnProfile = viewerId === profileData.id;

  // ✅ FIXED: Correct type annotation
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
              src={profileData.photoURL}
              name={profileData.displayName}
              className="h-24 w-24 md:h-32 md:w-32 border-4 border-card"
            />
            
            <div className="mt-4 sm:ml-6 flex-grow text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profileData.displayName}</h1>
              {profileData.email && (
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
              )}
            </div>
            
            <div className="mt-4 sm:mt-0">
              {!isOwnProfile && viewerId && (
                <FollowButton
                  currentUserId={viewerId}
                  targetId={profileData.id}
                />
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-center sm:justify-start">
            <FollowersFollowingCount 
              userId={profileData.id} 
              isTargetProfile={!isOwnProfile}
            />
          </div>
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