// src/app/dashboard/event/[eventId]/request/[participantId]/page.tsx
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/get-server-session';
import { getEventByIdAction } from '@/lib/server/actions/events';
import WishlistRequestClient from '@/app/wishlist/_components/WishlistRequestClient';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Event, EventMessage } from '@/types/event';
import { tsToIso } from '@/lib/client/tsToIso';

interface PageProps {
  params: Promise<{ eventId: string; participantId: string }>;
  searchParams: Promise<{ type?: string; tab?: string; subTab?: string }>;
}

export default async function WishlistRequestPage({ params, searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session) redirect('/auth/login');

  const { eventId, participantId } = await params;
  const { type = 'wishlist' } = await searchParams;

  const result = await getEventByIdAction(eventId);
  if (!result.success || !result.data) notFound();

  const serverEvent = result.data;

  // 🔹 Map ServerEvent → Event met async tsToIso
  const event: Event = await (async () => {
    const messages: EventMessage[] = await Promise.all(
      (serverEvent.messages ?? []).map(async (msg: any) => ({
        id: msg.id,
        senderId: msg.senderId ?? 'unknown',
        content: msg.content ?? '',
        timestamp: (await tsToIso(msg.timestamp)) ?? new Date().toISOString(),
      }))
    );

    return {
      ...serverEvent,
      messages,
      startDateTime: (await tsToIso(serverEvent.startDateTime)) ?? new Date().toISOString(),
      endDateTime: (await tsToIso(serverEvent.endDateTime)) ?? new Date().toISOString(),
      createdAt: (await tsToIso(serverEvent.createdAt)) ?? new Date().toISOString(),
      updatedAt: (await tsToIso(serverEvent.updatedAt)) ?? new Date().toISOString(),
      participants: serverEvent.participants ?? {},
    };
  })();

  const participant = Object.values(event.participants).find((p) => p.id === participantId);
  if (!participant) notFound();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WishlistRequestClient
        event={event}
        participant={participant}
        currentUser={session.user}
        type={type as 'invitation' | 'drawn' | 'wishlist' | 'crossOff'}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { eventId } = await params;
  return {
    title: 'Vraag een wishlist aan - Wish2Share',
    description: 'Nodig een deelnemer uit om een wishlist aan te maken',
  };
}
