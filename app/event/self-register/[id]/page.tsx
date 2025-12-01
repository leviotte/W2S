"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event } from "@/types/event";
import { HashLoader } from "react-spinners";
import { useStore } from "@/lib/store/useStore";
import { useAuth } from "@/app/dashboard/layout";
import { toast } from "sonner";

const EventParticipationPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useStore();
  const { showLoginModal } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const activeProfile = localStorage.getItem("activeProfile");

    const fetchEvent = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const eventDoc = await getDoc(doc(db, "events", id));
        if (!eventDoc.exists()) {
          router.push("/404");
          return;
        }
        const eventData = eventDoc.data() as Event;
        setEvent(eventData);

        if (currentUser) {
          const profilesQuery = query(
            collection(db, "profiles"),
            where("userId", "==", currentUser.id)
          );
          const profilesSnapshot = await getDocs(profilesQuery);
          setProfiles(profilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        toast.error("Ophalen evenement mislukt.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, router, currentUser]);

  const handleJoinEvent = async (selectedProfileId: string) => {
    if (!event || !selectedName) {
      toast.error("Selecteer eerst een naam");
      return;
    }

    if (!currentUser) {
      showLoginModal(() => window.location.reload());
      return;
    }

    setLoading(true);
    try {
      const isSubProfile = currentUser.id !== selectedProfileId;
      const subProfile = isSubProfile
        ? await getDoc(doc(db, "profiles", selectedProfileId))
        : null;

      const firstName = isSubProfile ? subProfile?.data()?.firstName : currentUser.firstName;
      const lastName = isSubProfile ? subProfile?.data()?.lastName : currentUser.lastName;

      const updatedParticipant = {
        id: isSubProfile ? selectedProfileId : currentUser.id,
        firstName,
        lastName,
        email: currentUser.email,
        name: `${firstName} ${lastName}`,
        profileId: isSubProfile ? selectedProfileId : null,
        confirmed: true,
        wishlistId: null,
      };

      const updatedDrawnames = { ...event.drawnNames };
      for (const name in updatedDrawnames) {
        if (updatedDrawnames[name] === selectedName) {
          updatedDrawnames[name] = isSubProfile ? selectedProfileId : currentUser.id;
        }
      }

      await updateDoc(doc(db, "events", id), {
        drawnNames: updatedDrawnames,
        [`participants.${selectedName}`]: updatedParticipant,
      });

      router.push(`/dashboard/event/${id}?tab=events&subTab=details`);
    } catch (err) {
      console.error("Error joining event:", err);
      toast.error("Er is iets misgegaan.");
    } finally {
      setLoading(false);
    }
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
          <div className="space-y-4">
            <button
              onClick={() => handleJoinEvent(currentUser?.id!)}
              className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hoofdaccount: {currentUser?.firstName} {currentUser?.lastName}
            </button>
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleJoinEvent(profile.id)}
                className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {profile.name}
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
      <div className="flex justify-center items-center">
        <img src="/welcome.svg" alt="Event" className="rounded-lg max-w-full h-auto" />
      </div>
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
        <h1 className="text-3xl font-bold text-warm-olive mb-4">Deelname aan evenement</h1>
        <h2 className="text-2xl font-bold text-warm-olive mb-4">{event.name}</h2>
        <p className="text-cool-olive mb-4">Selecteer uw naam om uw deelname te bevestigen.</p>
        <div className="w-full max-w-sm">
          <label htmlFor="name-select" className="block text-lg font-medium text-gray-600 mb-2">Selecteer uw naam:</label>
          <select
            id="name-select"
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-cool-olive focus:border-cool-olive"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
          >
            <option value="" disabled>-- Kies uw naam --</option>
            {Object.values(event.participants).map((p: any, idx) => (
              <option key={idx} value={p.id} disabled={p.confirmed}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setShowProfileSelect(true);
              if (!currentUser) showLoginModal();
            }}
            className="mt-4 px-6 py-2 rounded-lg shadow w-full bg-accent hover:bg-chart-5 text-white"
          >
            Join Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventParticipationPage;
