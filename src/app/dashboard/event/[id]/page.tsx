// src/app/dashboard/event/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session.server";
import { adminDb } from "@/lib/server/firebase-admin";
import type { Event } from "@/types/event";
import { eventSchema } from "@/types/event";
import EventDetailClient from "@/components/event/EventDetailClient";

// ============================================================================
// HELPER: RECURSIVE Firestore Timestamp converter
// ============================================================================
function convertFirestoreTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (obj && typeof obj === 'object' && '_seconds' in obj && '_nanoseconds' in obj) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
  }

  if (Array.isArray(obj)) return obj.map(convertFirestoreTimestamps);

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertFirestoreTimestamps(obj[key]);
      }
    }
    return converted;
  }

  return obj;
}

// ============================================================================
// FETCH EVENT DATA
// ============================================================================
async function getEventData(eventId: string): Promise<Event | null> {
  try {
    const docSnap = await adminDb.collection("events").doc(eventId).get();
    if (!docSnap.exists) return null;

    const rawData = { ...docSnap.data(), id: docSnap.id };
    const serializedData = convertFirestoreTimestamps(rawData);

    // Fix participants
    if (serializedData.participants && typeof serializedData.participants === 'object' && !Array.isArray(serializedData.participants)) {
      serializedData.participants = Object.entries(serializedData.participants).map(([id, p]: [string, any]) => ({
        id,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        confirmed: p.confirmed ?? false,
        role: p.role || 'participant',
        status: p.status || 'accepted',
        addedAt: p.addedAt || new Date().toISOString(),
        wishlistId: p.wishlistId || undefined,
        photoURL: p.photoURL || undefined,
        name: p.name || undefined,
        profileId: p.profileId || undefined,
      }));
    } else if (!serializedData.participants) {
      serializedData.participants = [];
    }

    const validation = eventSchema.safeParse(serializedData);
    if (!validation.success) return null;

    return validation.data;
  } catch {
    return null;
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================
interface PageProps {
  params: { id: string };
}

export default async function EventPage({ params }: PageProps) {
  const { id: eventId } = params;

  const session = await getSession();

  if (!session?.user?.isLoggedIn) {
  redirect(`/login?returnUrl=/dashboard/event/${eventId}`);
}

  const initialEvent = await getEventData(eventId);
  if (!initialEvent) notFound();

  // ✅ Inject `isLoggedIn: true` zodat types matchen
  const sessionUser = {
  ...session.user,
  isLoggedIn: true as const,
};

  return (
    <EventDetailClient
      eventId={eventId}
      initialEvent={initialEvent}
      sessionUser={sessionUser}
    />
  );
}

// ============================================================================
// METADATA
// ============================================================================
export async function generateMetadata({ params }: PageProps) {
  const event = await getEventData(params.id);
  if (!event) return { title: "Evenement niet gevonden | Wish2Share" };
  return {
    title: `${event.name} | Wish2Share`,
    description: event.description || `Bekijk details van ${event.name}`,
    openGraph: {
      title: event.name,
      description: event.description || undefined,
      images: event.imageUrl ? [event.imageUrl] : undefined,
    },
  };
}
