import { useState, useEffect } from 'react';
import type { Event, EventParticipant } from '@/types/event';

export const useEventParticipants = (event?: Event) => {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);

  useEffect(() => {
    if (!event || !event.participants) {
      setParticipants([]);
      return;
    }

    // ✅ FIXED: Convert Record naar Array met correcte typing
    const participantArray = Object.entries(event.participants)
      .map(([participantId, data]) => ({
        ...data,
        id: participantId,
      }))
      .sort((a, b) => {
        // Organisator eerst
        if (a.id === event.organizerId) return -1;
        if (b.id === event.organizerId) return 1;
        
        // Daarna alfabetisch op naam
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

    setParticipants(participantArray);
  }, [event]);

  return { participants };
};