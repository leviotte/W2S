"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/config/firebase";
import { getDoc, doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/components/AuthContext";
import { Event } from "@/types/event";

interface Props {
  params: { id: string };
}

export default function EventSelfRegistrationPage({ params }: Props) {
  const { id } = params;
  const router = useRouter();
  const { currentUser } = useStore();
  const { showLoginModal } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        if (!id) throw new Error("Event ID ontbreekt.");

        if (!currentUser) {
          toast.error("Log in om uw deelname te bevestigen.");
          showLoginModal();
          setLoading(false);
          return;
        }

        const eventDoc = await getDoc(doc(db, "events", id));
        if (!eventDoc.exists()) {
          router.push("/404");
          return;
        }
        setEvent(eventDoc.data() as Event);

        // Fetch user profiles
        const profilesQuery = query(
          collection(db, "profiles"),
          where("userId", "==", currentUser?.id)
        );
        const profilesSnapshot = await getDocs(profilesQuery);
        const userProfiles = profilesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (userProfiles.length > 0) setProfiles(userProfiles);
      } catch (err) {
        console.error("Error fetching event:", err);
        toast.error("Ophalen evenement mislukt.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, currentUser, router, showLoginModal]);

  const handleRegister = async (selectedId: string) => {
    if (!currentUser) {
      toast.error("Log in om deel te nemen aan het evenement");
      showLoginModal();
      return;
    }

    setLoading(true);
    const isSubProfile = currentUser.id !== selectedId;

    try {
      const subProfile = isSubProfile
        ? await getDoc(doc(db, "profiles", selectedId))
        : null;

      if (event?.participants && event.participants[selectedId]) {
        toast.info("U bent al geregistreerd voor dit evenement.");
        router.push(`/dashboard/event/${id}?tab=events&subTab=details`);
        return;
      }

      if (event && event.currentParticipantCount >= event.maxParticipants) {
        toast.error("Het evenement is al vol!");
        return;
      }

      const updatedParticipants = {
        ...event?.participants,
        [selectedId]: {
          id: selectedId,
          firstName: isSubProfile ? subProfile?.data()?.firstName : currentUser.firstName,
          lastName: isSubProfile ? subProfile?.data()?.lastName : currentUser.lastName,
          email: currentUser.email,
          name: isSubProfile
            ? `${subProfile?.data()?.firstName} ${subProfile?.data()?.lastName}`
            : `${currentUser.firstName} ${currentUser.lastName}`,
          profileId: isSubProfile ? selectedId : null,
          confirmed: true,
        },
      };

      await updateDoc(doc(db, "events", id), {
        participants: updatedParticipants,
        currentParticipantCount: (event?.currentParticipantCount || 0) + 1,
      });

      router.push(`/dashboard/event/${id}?tab=events&subTab=details`);
    } catch (err) {
      console.error("Error joining event:", err);
      toast.error("Deelname aan event niet gelukt.");
    } finally {
      setLoading(false);
    }
  };

  const checkIsConfirmed = (id: string) => {
    if (!event?.participants) return false;
    const participant = Object.values(event.participants).find((p: any) => p.id === id);
    return participant ? participant.confirmed : false;
  };

  if (loading || !event) {
    return (
      <div className="flex justify-center items-center h-screen">
        <HashLoader color="#4d7c0f" size={40} />
      </div>
    );
  }

  if (showProfileSelect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kies een profiel</h2>
          <p className="text-gray-600 mb-6">Selecteer met welk profiel je wilt deelnemen aan dit evenement.</p>
          <div className="space-y-4">
            <button
              onClick={() => handleRegister(currentUser?.id!)}
              disabled={checkIsConfirmed(currentUser?.id!)}
              className="disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hoofdaccount: {currentUser?.firstName} {currentUser?.lastName}
              {checkIsConfirmed(currentUser?.id!) && " (Reeds geregistreerd)"}
            </button>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleRegister(profile.id)}
                disabled={checkIsConfirmed(profile.id)}
                className="disabled:opacity-50 disabled:cursor-not-allowed w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {profile.firstName} {profile.lastName}
                {checkIsConfirmed(profile.id) && " (Reeds geregistreerd)"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowProfileSelect(false)}
            className="mt-6 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Terug
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 items-center min-h-screen p-6 gap-6 bg-gray-100">
      <div className="flex justify-center">
        <img src="/welcome.svg" alt="Event" className="rounded-lg max-w-full h-auto" />
      </div>
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
        <h1 className="text-3xl font-bold text-warm-olive mb-2">{event.name}</h1>
        <p className="text-lg text-gray-600 mb-4">
          Datum evenement: {event.date.split("-").reverse().join("-")} - {event.time || "Time not specified"}
        </p>
        <p className="text-lg text-gray-600 mb-4">
          Deelnemers: {event.currentParticipantCount || 1} / {event.maxParticipants || "Unlimited"}
        </p>
        <button
          onClick={() => setShowProfileSelect(true)}
          disabled={event.currentParticipantCount >= event.maxParticipants}
          className={`px-6 py-3 mt-4 w-full max-w-sm text-white rounded-lg shadow-md ${
            event.currentParticipantCount >= event.maxParticipants
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {event.currentParticipantCount >= event.maxParticipants ? "Event Vol" : "Deelnemen"}
        </button>
      </div>
    </div>
  );
}
