// app/profile/[username]/page.tsx
// DE "GOLD STANDARD" USER PROFILE PAGINA - 100% SERVER COMPONENT

import Link from 'next/link';
import { MapPin, Cake } from 'lucide-react';
import { notFound } from 'next/navigation';

// NIEUW: Veilige, server-side helpers importeren
import { getCurrentUser } from '@/lib/server/auth';
import { getUserProfileBySlug, getPublicWishlistsByUserId } from '@/services/userService';

// NIEUW: Client Components die we nodig hebben
import FollowButton from "@/components/FollowButton"; 
import FollowersFollowingCount from "@/components/FollowersFollowingCount";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Wishlist } from "@/types/user";

// De pagina ontvangt 'params' van de URL.
interface PageProps {
  params: {
    username: string; // Dit komt overeen met de mapnaam `[username]`
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  // Stap 1: Server-Side Authenticatie & Data Fetching (in parallel!)
  // We halen de ingelogde gebruiker (de 'viewer') en het profiel dat we bekijken tegelijk op.
  const [viewer, profileData] = await Promise.all([
    getCurrentUser(),
    getUserProfileBySlug(params.username)
  ]);
  
  // Als getUserProfileBySlug faalt, zal de `notFound()` al getriggerd zijn.
  
  // Stap 2: Haal de wenslijsten van de profielgebruiker op
  const wishlists = await getPublicWishlistsByUserId(profileData.id);

  // Stap 3: Bepaal de context
  // De 'viewer' is de ingelogde persoon die de pagina bezoekt.
  // 'profileData' is het profiel van de persoon wiens pagina we bekijken.
  const isOwner = viewer?.id === profileData.id;
  const viewerId = viewer?.id;

  // Stap 4: Render de UI met de 100% server-fetched data
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center shadow-xl rounded-lg p-8 bg-gray-100 flex flex-col items-center justify-center space-y-4">
        <UserAvatar
          src={profileData.photoURL ?? profileData.avatarURL}
          alt={`${profileData.firstName || profileData.name}'s profile`}
          className="w-32 h-32"
        />
        <h1 className="text-2xl text-accent font-bold my-4">
          {profileData.firstName
            ? `${profileData.firstName} ${profileData.lastName}`
            : profileData.name}
        </h1>

        {/* Details van het profiel */}
        {profileData.birthdate && (
          <p className="text-gray-600 flex justify-center my-2">
            <Cake className="mr-2 text-[#b34c4c]" />
            {new Date(profileData.birthdate).toLocaleDateString("nl-BE")}
          </p>
        )}
        {profileData.address?.city && (
          <p className="text-gray-600 flex justify-center my-2">
            <MapPin className="mr-2 text-blue-500" /> {profileData.address.city}
          </p>
        )}

        <div>
          {/* Conditioneel renderen van Client Components met server data */}
          {!isOwner && viewerId && (
            <FollowButton
              viewerId={viewerId}
              targetId={profileData.id}
              isTargetProfile={!!profileData.name} // Simpele check of het een subprofiel is
            />
          )}
          {isOwner && (
            <FollowersFollowingCount
              userId={profileData.id}
              isProfile={!!profileData.name}
            />
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-accent">
          Openbare wishlists
        </h2>
        {wishlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlists.map((wishlist) => (
              <Link
                key={wishlist.id}
                href={`/wishlist/${wishlist.id}`} // Correcte, publieke link naar een wishlist
                className="block p-4 rounded-xl shadow-xl hover:shadow-md bg-gray-100 hover:bg-gray-50 cursor-pointer transition-shadow"
              >
                <h3 className="text-lg font-medium">{wishlist.name}</h3>
                <p className="text-gray-500">{wishlist.items?.length || 0} items</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Deze gebruiker heeft nog geen openbare wishlists.</p>
        )}
      </div>
    </div>
  );
}