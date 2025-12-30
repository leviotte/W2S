// src/components/event/EventDetailClient.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import { toast } from 'sonner';
import { MessageSquareMore } from 'lucide-react';

import type { Event, EventParticipant, EventMessage } from '@/types/event';
import type { SessionUser, AuthenticatedSessionUser } from '@/types/session';
import type { Message } from '@/types/message';

import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useEventMessages } from '@/hooks/useEventMessages';

import EventDetails from '@/components/event/EventDetails';
import DrawnNameSection from './DrawnNameSection';
import { PartyPrepsSection } from '../party-preps/PartyPrepsSection';
import AdvancedEventProgressChecklist from './EventProgressChecklist';
import ParticipantProgress from '@/components/event/ParticipantProgress';
import EventWishlistsSection from './EventWishlistSection';
import GroupChat from '@/components/event/GroupChat';
import ExclusionModal from '@/components/event/ExclusionModal';
import WishlistRequestDialog from '@/app/wishlist/_components/WishlistRequestDialog';
import { LoadingSpinner } from '../ui/loading-spinner';

interface EventDetailClientProps {
  eventId: string;
  initialEvent: Event;
  sessionUser: AuthenticatedSessionUser; // strikt type
}

export default function EventDetailClient({
  eventId,
  initialEvent,
  sessionUser,
}: EventDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get('participantId') ?? undefined;
  const openWishlistRequestModal =
    searchParams.get('type') === 'wishlist' &&
    searchParams.get('subTab') === 'request';

  const [event, setEvent] = useState<Event>(initialEvent);
  const [currentUserId, setCurrentUserId] = useState<string>(sessionUser.id);
  const [wishlists, setWishlists] = useState<Record<string, any>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [exclusions, setExclusions] = useState<Record<string, string[]>>({});

  // ============================
  // ACTIVE PROFILE
  // ============================
  useEffect(() => {
    const activeProfile = localStorage.getItem('activeProfile');
    setCurrentUserId(
      !activeProfile || activeProfile === 'main-account'
        ? sessionUser.id
        : activeProfile
    );
  }, [sessionUser.id]);

  // ============================
  // HELPERS
  // ============================
  const convertFirestoreTimestamps = useCallback((obj: any): any => {
    if (!obj) return obj;
    if (obj?.toDate && typeof obj.toDate === 'function') return obj.toDate().toISOString();
    if (obj?._seconds !== undefined)
      return new Date(obj._seconds * 1000 + (obj._nanoseconds ?? 0) / 1_000_000).toISOString();
    if (Array.isArray(obj)) return obj.map(convertFirestoreTimestamps);
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) converted[key] = convertFirestoreTimestamps(obj[key]);
      return converted;
    }
    return obj;
  }, []);

  const participantsRecordToArray = useCallback(
    (participants: Record<string, EventParticipant> | EventParticipant[] | undefined) => {
      if (!participants) return [];
      if (Array.isArray(participants)) return participants;
      return Object.entries(participants).map(([id, p]) => ({ ...p, id }));
    },
    []
  );

  // Converteer EventMessages -> Message[]
  const mapMessages = useCallback(
    (messages: EventMessage[] | undefined): Message[] => {
      if (!messages) return [];
      return messages.map((msg) => ({
        id: msg.id,
        userId: msg.senderId,
        userName: 'Unknown User', // fallback, kan eventueel uit participants gehaald worden
        text: msg.content ?? '',
        timestamp: msg.timestamp ?? new Date().toISOString(),
        isAnonymous: false,
        edited: false,
        read: false,
        senderId: msg.senderId,
      }));
    },
    []
  );

  // ============================
  // REALTIME EVENT LISTENER
  // ============================
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = onSnapshot(doc(db, 'events', eventId), (docSnap) => {
      if (!docSnap.exists()) return;

      const rawData = { id: docSnap.id, ...docSnap.data() };
      const converted = convertFirestoreTimestamps(rawData);

      const participantsArray = participantsRecordToArray(converted.participants);
      const messagesArray = mapMessages(converted.messages);

      setEvent({
        ...converted,
        participants: participantsArray,
        messages: messagesArray,
      } as Event);
    });

    return () => unsubscribe();
  }, [eventId, convertFirestoreTimestamps, participantsRecordToArray, mapMessages]);

  // ============================
  // PARTICIPANTS HOOK
  // ============================
  const { participants } = useEventParticipants(event);

  // ============================
  // WISHLISTS LISTENER
  // ============================
  useEffect(() => {
    if (!participants?.length) return;

    const wishlistIds = participants
      .filter((p) => p.wishlistId)
      .map((p) => p.wishlistId as string);

    const unsubscribers = wishlistIds.map((wishlistId) =>
      onSnapshot(doc(db, 'wishlists', wishlistId), (docSnap) => {
        if (docSnap.exists()) setWishlists((prev) => ({ ...prev, [wishlistId]: docSnap.data() }));
      })
    );

    return () => unsubscribers.forEach((u) => u());
  }, [participants]);

  // ============================
  // EXCLUSIONS
  // ============================
  useEffect(() => setExclusions(event?.exclusions ?? {}), [event?.exclusions]);

  // ============================
  // ACCESS CONTROL
  // ============================
  useEffect(() => {
    if (!event || !currentUserId) return;
    const isOrganizer = event.organizer === currentUserId;
    const isParticipant = event.participants?.some((p) => p.id === currentUserId);
    if (!isOrganizer && !isParticipant) router.push('/404');
  }, [event, currentUserId, router]);

  const isOrganizer = event?.organizer === currentUserId;
  const drawnParticipantId = event?.drawnNames?.[currentUserId ?? ''];

  const participantsToBeDrawn = useMemo(() => {
    if (!currentUserId || !participants) return [];
    const excludedIds = event?.exclusions?.[currentUserId] ?? [];
    return participants.filter((p) => p.id !== currentUserId && !excludedIds.includes(p.id));
  }, [participants, event?.exclusions, currentUserId]);

  const canShowExclusion = useMemo(() => {
    if (!event?.isLootjesEvent) return false;
    const hasDrawnNames = event?.drawnNames && Object.keys(event.drawnNames).length > 0;
    const hasEnoughParticipants = (participants?.length ?? 0) > 3;
    return !hasDrawnNames && hasEnoughParticipants;
  }, [event, participants]);

  // ============================
  // EVENT UPDATES
  // ============================
  const handleUpdateEvent = useCallback(async (data: Partial<Event>) => {
    if (!event?.id) return;
    try {
      await updateDoc(doc(db, 'events', event.id), data);
      toast.success('Event bijgewerkt!');
    } catch (err) {
      console.error(err);
      toast.error('Kon event niet bijwerken');
    }
  }, [event?.id]);

  const handleNameDrawn = useCallback(
    async (drawnName: string) => {
      if (!event || !participants || !currentUserId) return;
      const participant = participants.find((p) => `${p.firstName} ${p.lastName}` === drawnName);
      if (!participant) return toast.error('Deelnemer niet gevonden');
      await handleUpdateEvent({ drawnNames: { ...event.drawnNames, [currentUserId]: participant.id } });
      toast.success(`Je trok ${drawnName}!`);
    },
    [event, participants, currentUserId, handleUpdateEvent]
  );

  const handleSaveExclusions = useCallback(
    async (newExclusions: Record<string, string[]>) => {
      await handleUpdateEvent({ exclusions: newExclusions });
      setExclusions(newExclusions);
      toast.success('Exclusies opgeslagen!');
    },
    [handleUpdateEvent]
  );

  // ============================
  // CHAT
  // ============================
  const { sendMessage, editMessage, deleteMessage } = useEventMessages(event?.messages ?? []);

  const handleSendMessage = useCallback(
    async (text: string, isAnonymous: boolean, gifUrl?: string) => {
      await sendMessage(text, isAnonymous, gifUrl);
    },
    [sendMessage]
  );

  const wishlistParticipant = useMemo(
    () => participantId ? participants?.find((p) => p.id === participantId) ?? null : null,
    [participants, participantId]
  );

  if (!event) return <LoadingSpinner />;

  return (
    <>
      {/* Background */}
      <div
        style={{
          backgroundImage: `url(${event.backgroundImage ?? 'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        className="w-full fixed h-screen top-0 -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-1 space-y-6">
          <EventDetails
            event={event}
            participants={participants ?? []}
            isOrganizer={isOrganizer}
            updateEvent={handleUpdateEvent}
          />
          {event.isLootjesEvent && (
            <DrawnNameSection
              event={event}
              participants={participants ?? []}
              drawnParticipantId={drawnParticipantId}
              onNameDrawn={handleNameDrawn}
              currentUserId={currentUserId}
            />
          )}
          <PartyPrepsSection
            event={event}
            isOrganizer={isOrganizer}
            participants={participants ?? []}
            currentUserId={currentUserId}
          />
        </div>

        {/* MIDDLE */}
        <div className="lg:col-span-1">
          {isOrganizer ? (
            <AdvancedEventProgressChecklist
              event={event}
              participants={participants ?? []}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              wishlists={wishlists}
            />
          ) : (
            <ParticipantProgress
              event={event}
              participants={participants ?? []}
              currentUserId={currentUserId}
              wishlists={wishlists}
              drawnParticipantId={drawnParticipantId}
            />
          )}
          <EventWishlistsSection
            participants={participants ?? []}
            currentUserId={currentUserId}
            eventId={event.id}
            maxPrice={event.budget}
            organizer={event.organizer}
            isDrawNames={event.isLootjesEvent}
            event={event}
          />
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          {event.isLootjesEvent && isOrganizer && canShowExclusion && (
            <ExclusionModal
              isOpen={true}
              exclusions={exclusions}
              participants={participants ?? []}
              onClose={() => {}}
              onSave={handleSaveExclusions}
            />
          )}

          {/* DESKTOP CHAT */}
          <div className="hidden xs:block">
            <GroupChat
              eventId={event.id}
              messages={mapMessages(event.messages)}
              currentUserId={currentUserId}
              currentUserName={`${sessionUser.firstName ?? ''} ${sessionUser.lastName ?? ''}`}
              onSendMessage={handleSendMessage}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
            />
          </div>

          {/* MOBILE CHAT */}
          <div className="xs:hidden fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-green-900 hover:bg-green-950 text-white p-4 rounded-full shadow-lg"
            >
              <MessageSquareMore className="w-6 h-6" />
            </button>
            {isChatOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="rounded-lg shadow-lg p-6 w-full max-w-lg">
                  <GroupChat
                    eventId={event.id}
                    messages={mapMessages(event.messages)}
                    currentUserId={currentUserId}
                    currentUserName={`${sessionUser.firstName ?? ''} ${sessionUser.lastName ?? ''}`}
                    onSendMessage={handleSendMessage}
                    onEditMessage={editMessage}
                    onDeleteMessage={deleteMessage}
                    onClose={() => setIsChatOpen(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wishlist Request Modal */}
      {openWishlistRequestModal && wishlistParticipant && (
        <WishlistRequestDialog
          isOpen
          onClose={() => router.replace(`/dashboard/event/${event.id}?tab=event`)}
          context={{
            type: 'event',
            event: { id: event.id, name: event.name },
            participant: {
              id: wishlistParticipant.id,
              firstName: wishlistParticipant.firstName,
              lastName: wishlistParticipant.lastName,
              email: wishlistParticipant.email ?? undefined,
            },
          }}
        />
      )}
    </>
  );
}
