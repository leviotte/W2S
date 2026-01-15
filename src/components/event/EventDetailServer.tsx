'use server';

import EventDetails from './EventDetails';
import DrawnNameSection from './DrawnNameSection';
import { PartyPrepsSection } from '../party-preps/PartyPrepsSection';
import AdvancedEventProgressChecklist from './EventProgressChecklist';
import ParticipantProgress from './ParticipantProgress';
import EventWishlistsSection from './EventWishlistSection';
import GroupChatServer from './GroupChatServer';
import ExclusionModalServer from './ExclusionModalServer';
import WishlistRequestDialogServer from '@/app/wishlist/_components/WishlistRequestDialogServer';

import type { Event, EventParticipant, AuthenticatedSessionUser } from '@/types/event';
import { useMemo } from 'react';

interface EventDetailServerProps {
  event: Event;
  sessionUser: AuthenticatedSessionUser;
  participantId?: string;
  openWishlistRequestModal?: boolean;
}

export default function EventDetailServer({
  event,
  sessionUser,
  participantId,
  openWishlistRequestModal,
}: EventDetailServerProps) {
  const currentUserId = sessionUser.id;
  const isOrganizer = event.organizer === currentUserId;

  const participants: EventParticipant[] = useMemo(() => {
    return Object.entries(event.participants ?? {}).map(([id, p]) => ({ ...p, id }));
  }, [event.participants]);

  const drawnParticipantId = event.drawnNames?.[currentUserId];

  const participantsToBeDrawn = useMemo(() => {
    const excludedIds = event.exclusions?.[currentUserId] ?? [];
    return participants.filter((p) => p.id !== currentUserId && !excludedIds.includes(p.id));
  }, [participants, currentUserId, event.exclusions]);

  const canShowExclusion = useMemo(() => {
    if (!event.isLootjesEvent) return false;
    const hasDrawnNames = !!event.drawnNames && Object.keys(event.drawnNames).length > 0;
    const hasEnoughParticipants = participants.length > 3;
    return !hasDrawnNames && hasEnoughParticipants;
  }, [event.isLootjesEvent, event.drawnNames, participants]);

  const wishlistParticipant = useMemo(() => {
    if (!participantId) return null;
    return participants.find((p) => p.id === participantId) ?? null;
  }, [participants, participantId]);

  return (
    <>
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
            participants={participants}
            isOrganizer={isOrganizer}
            updateEvent={async (data) => {
              // call server action
            }}
          />
          {event.isLootjesEvent && (
            <DrawnNameSection
              event={event}
              participants={participants}
              drawnParticipantId={drawnParticipantId}
              onNameDrawn={async (drawnName) => {
                // server action
              }}
              currentUserId={currentUserId}
            />
          )}
          <PartyPrepsSection
            event={event}
            isOrganizer={isOrganizer}
            participants={participants}
            currentUserId={currentUserId}
          />
        </div>

        {/* MIDDLE */}
        <div className="lg:col-span-1">
          {isOrganizer ? (
            <AdvancedEventProgressChecklist
              event={event}
              participants={participants}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              wishlists={event.wishlists ?? {}}
            />
          ) : (
            <ParticipantProgress
              event={event}
              participants={participants}
              currentUserId={currentUserId}
              wishlists={event.wishlists ?? {}}
              drawnParticipantId={drawnParticipantId}
            />
          )}
          <EventWishlistsSection
            participants={participants}
            currentUserId={currentUserId}
            eventId={event.id}
            maxPrice={event.budget ?? 0}
            organizer={event.organizer}
            isDrawNames={!!event.isLootjesEvent}
            event={event}
          />
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          {event.isLootjesEvent && isOrganizer && canShowExclusion && (
  <ExclusionModalServer
  eventId={event.id}
  participants={participants}
  exclusions={event.exclusions ?? {}}
/>
)}
          <GroupChatServer
            eventId={event.id}
            currentUserId={currentUserId}
            currentUserName={`${sessionUser.firstName ?? ''} ${sessionUser.lastName ?? ''}`}
          />
        </div>
      </div>

      {openWishlistRequestModal && wishlistParticipant && (
  <WishlistRequestDialogServer
    event={event}
    participant={wishlistParticipant}
  />
)}

    </>
  );
}
