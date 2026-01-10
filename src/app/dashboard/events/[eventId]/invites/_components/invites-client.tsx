// src/app/dashboard/event/[id]/invites/_components/invites-client.tsx
'use client';

import { useSearchParams } from 'next/navigation'; // ✅ NU MAG HET WEL
import { Event } from '@/types/event';

interface EventInvitesClientProps {
  event: Event;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function EventInvitesClient({ event, searchParams }: EventInvitesClientProps) {
  // ✅ Of gebruik de server-side searchParams, of gebruik de hook
  const clientSearchParams = useSearchParams();
  
  // ... rest van je component logic

  return (
    <div>
      {/* Je bestaande component content */}
    </div>
  );
}