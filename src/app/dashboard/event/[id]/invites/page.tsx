// src/app/dashboard/event/[id]/invites/page.tsx
import 'server-only';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getEventById } from '@/lib/server/data/events';
import EventInvitesClient from './_components/invites-client';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>; // ✅ Server Component manier
}

export default async function EventInvitesPage({ params, searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }

  const { id } = await params;
  const search = await searchParams;

  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  // Check if user is organizer
  if (event.organizerId !== user.id) {
    notFound();
  }

  // ✅ Pass searchParams to client component if needed
  return <EventInvitesClient event={event} searchParams={search} />;
}