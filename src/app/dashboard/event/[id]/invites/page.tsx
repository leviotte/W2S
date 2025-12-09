// src/app/dashboard/event/[id]/invites/page.tsx
import 'server-only';
import { notFound, useSearchParams } from 'next/navigation';
import { getAuthenticatedUserProfile } from '@/lib/auth/actions';
import { getEventById } from '@/lib/server/data/events';
import EventInvitesClient from './_components/invites-client';

interface InvitesPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EventInvitesPage({ params, searchParams }: InvitesPageProps) {
  const user = await getAuthenticatedUserProfile();
  // Deze check gebeurt nu veilig op de server.
  if (!user) {
    return notFound();
  }

  const event = await getEventById(params.id);
  // Ook deze check is nu server-side.
  if (!event || event.organizerId !== user.id) {
    return notFound();
  }
  
  const type = typeof searchParams.type === 'string' ? searchParams.type : 'invitation';

  // We geven de benodigde data als prop door aan de client component.
  return <EventInvitesClient event={event} user={user} type={type} />;
}