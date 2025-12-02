"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { MapPin, Cake } from "lucide-react";
import FollowButton from "@/src/components/FollowButton";
import FollowersFollowingCount from "@/src/components/FollowersFollowingCount";
import { useStore } from "@/src/lib/store/useStore";

interface Wishlist {
  id: string;
  name: string;
  items: any[];
  isPrivate: boolean;
  slug: string;
}

interface PageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function UserProfilePage({ params }: PageProps) {
  const { type, id } = params;
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useStore();
  const isAccountOwner = currentUser?.id === id;
  const isProfileOwner = localStorage.getItem("activeProfile") === id;
  const activeProfileId = localStorage.getItem("activeProfile");
  const currentUserId =
    activeProfileId != "main-account" ? activeProfileId : currentUser?.id;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        let data;

        if (type === "account") {
          const docRef = doc(db, "users", id!);
          const docSnap = await getDoc(docRef);
          data = docSnap.exists() ? docSnap.data() : null;
        } else if (type === "profile") {
          const docRef = doc(db, "profiles", id!);
          const docSnap = await getDoc(docRef);
          data = docSnap.exists() ? docSnap.data() : null;
        }

        setProfileData(data);

        const wishlistsQuery = query(
          collection(db, "wishlists"),
          where("owner", "==", id),
          where("isPrivate", "==", false)
        );
        const wishlistsSnap = await getDocs(wishlistsQuery);
        const wishlistsData = wishlistsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setWishlists(wishlistsData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [type, id]);

  const [userData, setUserData] = useState<any>();
  const activeProfile = localStorage.getItem("activeProfile");
  const isMainProfile = activeProfile == "main-account";

  useEffect(() => {
    const getProfileData = async () => {
      const userId = isMainProfile ? currentUser?.id : activeProfile;
      const collectionName = isMainProfile ? "users" : "profiles";
      const profileDoc = await getDoc(doc(db, collectionName, userId!));
      setUserData(profileDoc.data());
    };
    getProfileData();
  }, [currentUser?.id, activeProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profiel niet gevonden.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center shadow-xl rounded-lg p-8 bg-gray-100 flex flex-col items-center justify-center space-y-4">
        <img
          src={
            profileData.photoURL ||
            profileData.avatarURL ||
            "/default-avatar.png"
          }
          alt={`${profileData.firstName || profileData.name}'s profile`}
          className="w-32 h-32 rounded-full mx-auto shadow-xl"
        />
        <h1 className="text-2xl text-accent font-bold my-4">
          {profileData.firstName
            ? `${profileData.firstName} ${profileData.lastName}`
            : profileData.name}
        </h1>
        {profileData.birthdate && (
          <p className="text-gray-600 flex justify-center my-2">
            <Cake className="mr-2 text-[#b34c4c]" />
            {new Date(profileData.birthdate).toLocaleDateString("en-GB")}
          </p>
        )}
        {profileData.address?.city && (
          <p className="text-gray-600 flex justify-center my-2">
            <MapPin className="mr-2 text-blue-500" /> {profileData.address?.city}
          </p>
        )}
        <div>
          {isAccountOwner || isProfileOwner ? null : (
            <FollowButton
              currentUserId={currentUserId!}
              targetId={id!}
              isTargetProfile={type === "profile"}
              isCurrentUserProfile={activeProfileId != "main-account"}
            />
          )}
          {(isAccountOwner || isProfileOwner) && (
            <FollowersFollowingCount
              userId={currentUserId!}
              isTargetProfile={type === "profile"}
            />
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-accent">Openbare wishlist</h2>
        {wishlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlists.map((wishlist) => (
              <div
                key={wishlist.id}
                className="p-4 rounded-xl shadow-xl hover:shadow-md bg-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  router.push(
                    `/dashboard/wishlist/${wishlist.slug}?tab=wishlists&subTab=details`
                  )
                }
              >
                <h3 className="text-lg font-medium">{wishlist.name}</h3>
                <p className="text-gray-500">{wishlist.items.length} items</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Geen openbare wishlist beschikbaar.</p>
        )}
      </div>
    </div>
  );
}
