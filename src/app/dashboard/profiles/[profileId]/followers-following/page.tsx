"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/src/lib/firebase";
import { getDocs, collection, getDoc, doc } from "firebase/firestore";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { useStore } from "@/src/lib/store/useStore";

interface Props {
  params: { profileId: string };
}

export default function FollowersFollowingList({ params }: Props) {
  const { profileId } = params;
  const searchParams = useSearchParams();
  const subTab = searchParams.get("subTab");
  const isFollowers = subTab === "followers";
  const router = useRouter();

  const { currentUser } = useStore();
  const activeProfileId = localStorage.getItem("activeProfile");
  const currentUserId =
    activeProfileId !== "main-account" ? activeProfileId : currentUser?.id;

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!currentUserId) return;

        const isProfile = activeProfileId !== "main-account";
        const collectionPath = `${
          isProfile ? "profiles" : "users"
        }/${currentUserId}/${isFollowers ? "followers" : "following"}`;

        const snapshot = await getDocs(collection(db, collectionPath));

        const data = await Promise.all(
          snapshot.docs.map(async (snapshotDoc) => {
            const { type: entityType } = snapshotDoc.data();
            const entityDocRef = doc(db, entityType, snapshotDoc.id);
            const entityDoc = await getDoc(entityDocRef);
            if (entityDoc.exists()) {
              return {
                id: snapshotDoc.id,
                type: entityType,
                ...entityDoc.data(),
              };
            }
            return null;
          })
        );

        setList(data.filter((item) => !!item));
      } catch (error) {
        console.error("Fout bij ophalen volgers/volgend gegevens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId, activeProfileId, isFollowers]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900 mb-6">
        {isFollowers ? "Followers" : "Following"}
      </h1>
      <div className="space-y-4">
        {list.map((item) => (
          <div
            key={item.id}
            onClick={() =>
              router.push(
                `/dashboard/profiles/${
                  item.type === "users" ? "account" : "profile"
                }/${item.id}?tab=users&subTab=profile`
              )
            }
            className="flex items-center cursor-pointer gap-4 p-4 bg-white rounded-lg shadow hover:shadow-md transition hover:bg-gray-50"
          >
            <img
              src={
                item.type === "users"
                  ? item.photoURL || "/default-avatar.png"
                  : item.avatarURL || "/default-avatar.png"
              }
              alt={`${item.firstName || item.name}'s avatar`}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <h3 className="text-lg font-medium">
                {item.firstName || item.name}
              </h3>
              <p className="text-gray-500 text-sm">{item?.address?.city}</p>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-center text-gray-500">
            Niet {isFollowers ? "followers" : "following"} gevonden.
          </p>
        )}
      </div>
    </div>
  );
}
