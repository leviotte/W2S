// src/components/event/ParticipantList.tsx
"use client";

import DraggableParticipant from "@/components/party-preps/DraggableParticipant";
import type { EventParticipant } from "@/types/event";

interface ParticipantListProps {
  participants: EventParticipant[];
  currentUserId: string;
}

export default function ParticipantList({
  participants,
  currentUserId,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">Geen deelnemers gevonden</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {participants.map((participant) => (
        <DraggableParticipant
          key={participant.id}
          id={participant.id}
          firstName={participant.firstName}
          lastName={participant.lastName}
          photoURL={participant.photoURL}
          isCurrentUser={participant.id === currentUserId}
        />
      ))}
    </div>
  );
}