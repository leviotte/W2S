import { useState, useEffect } from 'react';
import { Event, Participant } from '@/types/event';

export const useEventParticipants = (event?: Event) => {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!event) return;

    const participantArray = Object.entries(event.participants || {})
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => {
        if (a.id === event.organizerId) return -1;
        if (b.id === event.organizerId) return 1;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });

    setParticipants(participantArray);
  }, [event]);

  return { participants };
};
