// src/app/dashboard/event/past/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { PastEventsClientPage } from './_components/past-events-client-page';
import { getEventsForUser } from '@/lib/server/actions/events';
import type { Event, EventMessage } from '@/types/event';
import { tsToIso } from '@/lib/client/tsToIso';

export default async function PastEventsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id)
    redirect('/?modal=login&callbackUrl=/dashboard/event/past');

  const resultData = await getEventsForUser(currentUser.id);

  // 🔹 Map ServerEvent → Event + filter verleden
  const pastEvents: Event[] = (
    await Promise.all(
      resultData.map(async (ev: any): Promise<Event> => {
        const messages: EventMessage[] = await Promise.all(
          (ev.messages ?? []).map(async (msg: any) => ({
            id: msg.id,
            senderId: msg.senderId ?? 'unknown',
            content: msg.content ?? '',
            timestamp: (await tsToIso(msg.timestamp)) ?? new Date().toISOString(),
          }))
        );

        return {
          ...ev,
          messages,
          startDateTime: (await tsToIso(ev.startDateTime)) ?? new Date().toISOString(),
          endDateTime: (await tsToIso(ev.endDateTime)) ?? new Date().toISOString(),
          createdAt: (await tsToIso(ev.createdAt)) ?? new Date().toISOString(),
          updatedAt: (await tsToIso(ev.updatedAt)) ?? new Date().toISOString(),
          participants: ev.participants ?? {},
        };
      })
    )
  ).filter((ev) => new Date(ev.startDateTime) < new Date());

  return (
    <PastEventsClientPage
      initialEvents={pastEvents}
      currentUserId={currentUser.id}
    />
  );
}
