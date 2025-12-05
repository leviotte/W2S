"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ErrorBoundary } from "react-error-boundary";

import EventDetails from "@/components/event/EventDetails";
import DrawnNameSection from "@/components/event/DrawnNameSection";
import WishlistsSection from "@/components/wishlist/WishlistsSection";
import GroupChat from "@/components/event/GroupChat";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorFallback from "@/components/ErrorFallback";
import PartyPrepsSection from "@/components/party-preps/PartyPrepsSection";
import AdvancedEventProgressChecklist from "@/components/event/AdvancedEventProgressChecklist";
import ParticipantProgress from "@/components/event/ParticipantProgress";

import { useStore } from "@/lib/store/use-auth-store";
import { useEventMessages } from "@/hooks/useEventMessages";
import { useEventParticipants } from "@/hooks/useEventParticipants";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/client/firebase";

import { X, MessageSquareMoreIcon } from "lucide-react";

export default function EventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = searchParams || {};

  const { currentUser, updateEvent } = useStore();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>();
  const [error, setError] = useState<Error | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [drawingModalToggle, setDrawingModalToggle] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [exclusions, setExclusions] = useState<Record<string, string[]>>({});
  const [wishlists, setWishlists] = useState<Record<string, any>>({});
  const activeProfile = localStorage.getItem("activeProfile");
  const isMainAccount = activeProfile === "main-account";

  const account = isMainAccount ? currentUser?.id : activeProfile;

  // Firebase realtime listener
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "events", id), (docSnap) => {
      if (!docSnap.exists()) {
        router.push("/404");
        return;
      }
      setEvent(docSnap.data());
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  const { participants } = useEventParticipants(event);
  const { handleSendMessage, handleEditMessage, handleDeleteMessage } =
    useEventMessages(event, currentUser);

  // Wishlists listener
  useEffect(() => {
    if (!participants || participants.length === 0) return;

    const wishlistIds = participants
      .filter((p) => p.wishlistId)
      .map((p) => p.wishlistId as string);

    if (wishlistIds.length === 0) return;

    const unsubscribers = wishlistIds.map((wishlistId) => {
      const wishlistRef = doc(db, "wishlists", wishlistId);

      return onSnapshot(wishlistRef, (docSnap) => {
        if (docSnap.exists()) {
          setWishlists((prev) => ({
            ...prev,
            [wishlistId]: docSnap.data(),
          }));
        }
      });
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [participants]);

  useEffect(() => {
    if (event?.exclusions) setExclusions(event.exclusions);
    else setExclusions({});
  }, [event]);

  const participantsTobeDrawn = useMemo(() => {
    const excludedIds = event?.exclusions?.[account || ""] || [];
    return participants?.filter((p) => p.id !== account && !excludedIds.includes(p.id));
  }, [participants, event, account]);

  const handleNameDrawn = async (drawnName: string) => {
    try {
      const participant = participants.find(
        (p) => `${p.firstName} ${p.lastName}` === drawnName
      );
      if (!participant) throw new Error("Deelnemer niet gevonden");

      await updateEvent(event.id, {
        drawnNames: {
          ...event!.drawnNames,
          [account || ""]: participant.id,
        },
      });
      toast.success(`Je trok ${drawnName}!`);
    } catch {
      toast.error("Er is iets misgegaan bij het trekken van een naam.");
    }
  };

  const getDrawnName = () => {
    const drawnId = event?.drawnNames?.[account || ""];
    const drawnParticipant = participants?.find((p) => p.id === drawnId);
    return drawnParticipant
      ? `${drawnParticipant.firstName} ${drawnParticipant.lastName}`
      : undefined;
  };

  const handleExclusionChange = (personId: string, excludedId: string, isExcluded: boolean) => {
    setExclusions((prev) => {
      const newExclusions = { ...prev };
      if (!newExclusions[personId]) newExclusions[personId] = [];

      if (isExcluded) {
        newExclusions[personId].push(excludedId);
      } else {
        newExclusions[personId] = newExclusions[personId].filter((id) => id !== excludedId);
      }

      return newExclusions;
    });
  };

  const saveExclusions = async () => {
    try {
      await updateEvent(event?.id, { exclusions });
      setShowExclusionModal(false);
      toast.success("Exclusions saved successfully!");
    } catch {
      toast.error("Error saving exclusions");
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  if (!event || !currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Evenement niet gevonden.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 text-warm-olive hover:text-cool-olive">
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="relative">
        {/* Background Image */}
        <div
          style={{
            backgroundImage: `url(${event.backgroundImage || "https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media"})`,
          }}
          className="w-full fixed h-[100vh] top-0 z-[-1] bg-cover bg-center"
        />

        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <EventDetails
              {...event}
              onUpdate={async (data) => {
                try {
                  await updateEvent(event.id, { ...event, ...data });
                } catch {
                  toast.error("Fout bij bijwerken");
                }
              }}
              isEditing={false}
              setIsEditing={() => {}}
              drawingModalToggle={drawingModalToggle}
              setDrawingModalToggle={setDrawingModalToggle}
              participants={participants}
            />

            {event?.isLootjesEvent && (
              <DrawnNameSection
                drawnName={getDrawnName()}
                participantsTobeDrawn={participantsTobeDrawn}
                participants={participants}
                onNameDrawn={handleNameDrawn}
                eventId={event.id}
                showDrawingModal={showDrawingModal}
                setShowDrawingModal={setShowDrawingModal}
                event={event}
              />
            )}

            <PartyPrepsSection
              eventId={event.id}
              isOrganizer={event.organizer === account}
              participants={participants}
              currentUserId={currentUser.id}
            />
          </div>

          <div className="lg:col-span-1">
            {event.organizer === account ? (
              <AdvancedEventProgressChecklist
                event={event}
                drawnNames={event?.drawnNames}
                participants={participants}
                currentUserId={account || ""}
                isOrganizer={true}
                wishlists={wishlists}
              />
            ) : (
              <ParticipantProgress
                event={event}
                drawnNames={event?.drawnNames}
                participants={participants}
                currentUserId={account || ""}
                wishlists={wishlists}
              />
            )}

            <WishlistsSection
              showLinkModal={showLinkModal}
              setShowLinkModal={setShowLinkModal}
              participants={participants}
              currentUserId={account || ""}
              eventId={event.id}
              activeProfile={activeProfile || ""}
              currentUser={currentUser}
              isDrawNames={event?.isLootjesEvent}
              isRemoveMode={isRemoveMode}
              setIsRemoveMode={setIsRemoveMode}
              showAddMemberModal={showAddMemberModal}
              setShowAddMemberModal={setShowAddMemberModal}
              organizer={event.organizer}
              maxPrice={event.budget}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
