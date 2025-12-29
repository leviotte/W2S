// src/app/dashboard/event/past/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { PastEventsClientPage } from './_components/past-events-client-page';
import { getUserEventsAction } from '@/lib/server/actions/events';
import type { Event } from '@/types/event';

export default async function PastEventsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    redirect('/?modal=login&callbackUrl=/dashboard/event/past');
  }

  const result = await getUserEventsAction({ userId: currentUser.id, filter: 'past' });
  const pastEvents: Event[] = result.success && result.data ? result.data : [];

  return (
    <PastEventsClientPage
      initialEvents={pastEvents}
      currentUserId={currentUser.id}
    />
  );
}
