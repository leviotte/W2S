// app/dashboard/event/[id]/participate/page.tsx
import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import { adminDb } from '@/lib/server/firebase-admin';
import { eventSchema } from '@/lib/server/types/event-admin';
import { subProfileSchema, type SubProfile } from '@/types/user';
import ParticipateClient from './participate.client';

interface Props {
  params: { id: string };
}

export default async function EventParticipatePage({ params }: Props) {
  // ------------------------------
  // GET SESSION VIA AUTH.JS
  // ------------------------------
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) redirect('/auth/login');

  // ------------------------------
  // MAP USER → SubProfile
  // ------------------------------
  const userSubProfile: SubProfile = {
    id: user.id,
    userId: user.id,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    displayName_lowercase: (user.displayName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`).toLowerCase(),
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    displayName: user.displayName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`,
    photoURL: user.photoURL ?? null,
  };

  // ------------------------------
  // FETCH EVENT
  // ------------------------------
  const eventSnap = await adminDb.collection('events').doc(params.id).get();
  if (!eventSnap.exists) notFound();

  const rawEvent = {
    id: eventSnap.id,
    ...eventSnap.data(),
  };

  const parsed = eventSchema.safeParse(rawEvent);
  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error('Event data corrupt');
  }

  const event = parsed.data;

  // ------------------------------
  // ALREADY PARTICIPATING → REDIRECT
  // ------------------------------
  if (Object.values(event.participants).some(p => p.id === user.id)) {
    redirect(`/dashboard/event/${event.id}`);
  }

  // ------------------------------
  // FETCH SUB-PROFILES
  // ------------------------------
  const profilesSnap = await adminDb
    .collection('profiles')
    .where('userId', '==', user.id)
    .get();

  const profiles: SubProfile[] = [
    userSubProfile,
    ...profilesSnap.docs.map(doc => subProfileSchema.parse({
      id: doc.id,
      ...(doc.data() as Omit<SubProfile, 'id'>),
    })),
  ];

  return (
    <ParticipateClient
      event={event}
      profiles={profiles}
    />
  );
}
