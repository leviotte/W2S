"use client";

import DraggableParticipant from "../party-preps/DraggableParticipant";

interface ParticipantListProps {
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  currentUserId: string;
}

export default function ParticipantList({
  participants,
  currentUserId,
}: ParticipantListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {participants.map((participant) => (
        <DraggableParticipant
          key={participant.id}
          participant={participant}
          isCurrentUser={participant.id === currentUserId}
        />
      ))}
    </div>
  );
}
