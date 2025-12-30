// src/app/dashboard/event/past/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { PastEventsClientPage } from './_components/past-events-client-page';
import { getEventsForUser } from '@/lib/server/actions/events';
import type { Event } from '@/types/event';

export default async function PastEventsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    redirect('/?modal=login&callbackUrl=/dashboard/event/past');
  }

  const resultData = await getEventsForUser(currentUser.id);

// Omdat getEventsForUser alleen Event[] teruggeeft, hoef je geen .success check te doen
const pastEvents: Event[] = resultData.filter(
  e => new Date(e.startDateTime) < new Date()
);

  return (
    <PastEventsClientPage
      initialEvents={pastEvents}
      currentUserId={currentUser.id}
    />
  );
}
