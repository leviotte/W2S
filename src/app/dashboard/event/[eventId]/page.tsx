// src/app/dashboard/event/[eventId]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { adminDb } from "@/lib/server/firebase-admin";
import type { Event, EventParticipant } from "@/types/event";
import { eventSchema } from "@/lib/server/types/event-admin";
import EventDetailServer from "@/components/event/EventDetailServer";

// ============================================================================
// HELPER: RECURSIVE Firestore Timestamp converter
// ============================================================================
function convertFirestoreTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (obj && typeof obj === "object" && "_seconds" in obj && "_nanoseconds" in obj) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
  }

  if (Array.isArray(obj)) return obj.map(convertFirestoreTimestamps);

  if (typeof obj === "object") {
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
    const participants: Record<string, EventParticipant> = {};
    if (serializedData.participants && typeof serializedData.participants === "object") {
      for (const [id, pRaw] of Object.entries(serializedData.participants)) {
        const p = pRaw as Partial<EventParticipant>;
        participants[id] = {
          id,
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          email: p.email ?? "",
          confirmed: p.confirmed ?? false,
          role: p.role || "participant",
          status: p.status || "accepted",
          addedAt: p.addedAt ?? new Date().toISOString(),
          wishlistId: p.wishlistId ?? undefined,
          photoURL: p.photoURL ?? undefined,
          name: p.name ?? undefined,
          profileId: p.profileId ?? undefined,
        };
      }
    }

    const dataToValidate = { ...serializedData, participants };
    const validation = eventSchema.safeParse(dataToValidate);
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

  // ✅ Gebruik NextAuth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?returnUrl=/dashboard/event/${eventId}`);
  }

  const initialEvent = await getEventData(eventId);
  if (!initialEvent) notFound();

  // ✅ Typesafe sessieUser voor EventDetailServer
  const sessionUser = {
    ...session.user,
    isLoggedIn: true as const,
  };

  return (
    <EventDetailServer
      event={initialEvent}
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
    description: event.additionalInfo || `Bekijk details van ${event.name}`,
    openGraph: {
      title: event.name,
      description: event.additionalInfo || undefined,
      images: event.backgroundImage ? [event.backgroundImage] : undefined,
    },
  };
}
