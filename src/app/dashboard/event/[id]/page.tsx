// src/app/dashboard/event/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/server/firebase-admin";
import type { Event } from "@/types/event";
import { eventSchema } from "@/types/event";
import EventDetailClient from "@/components/event/EventDetailClient";

// ============================================================================
// HELPER: RECURSIVE Firestore Timestamp converter
// ============================================================================

function convertFirestoreTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Check if it's a Firestore Timestamp
  if (obj && typeof obj === 'object' && '_seconds' in obj && '_nanoseconds' in obj) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
  }
  
  // Recursively process arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertFirestoreTimestamps(item));
  }
  
  // Recursively process objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertFirestoreTimestamps(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}

// ============================================================================
// SERVER ACTIONS - DATA FETCHING
// ============================================================================

async function getEventData(eventId: string): Promise<Event | null> {
  try {
    const eventRef = adminDb.collection("events").doc(eventId);
    const docSnap = await eventRef.get();

    if (!docSnap.exists) {
      console.log(`❌ Event ${eventId} not found`);
      return null;
    }

    // ✅ Get raw data
    const rawData = { ...docSnap.data(), id: docSnap.id };
    
    // ✅ RECURSIVELY convert ALL Firestore Timestamps
    const serializedData = convertFirestoreTimestamps(rawData);
    
    // ✅ CRITICAL FIX: Convert participants from Record to Array (WITH required fields!)
    const participantsData = serializedData.participants;
    if (participantsData && typeof participantsData === 'object' && !Array.isArray(participantsData)) {
      console.log('🔄 Converting participants from Record to Array');
      serializedData.participants = Object.entries(participantsData).map(([id, participant]: [string, any]) => ({
        id,
        firstName: participant.firstName || '',
        lastName: participant.lastName || '',
        email: participant.email || '',
        confirmed: participant.confirmed ?? false,
        role: participant.role || 'participant',
        status: participant.status || 'accepted',
        addedAt: participant.addedAt || new Date().toISOString(),
        wishlistId: participant.wishlistId || undefined,
        photoURL: participant.photoURL || undefined,
        name: participant.name || undefined,
        profileId: participant.profileId || undefined,
      }));
    } else if (!participantsData) {
      // No participants yet
      serializedData.participants = [];
    }
    
    console.log('✅ Serialized event data:', JSON.stringify(serializedData, null, 2));

    // ✅ Validate
    const validation = eventSchema.safeParse(serializedData);

    if (!validation.success) {
      console.error(
        `❌ Event data validation failed for ID ${eventId}:`,
        JSON.stringify(validation.error.format(), null, 2)
      );
      console.error('❌ Validation issues:', validation.error.issues);
      return null;
    }

    console.log('✅ Event validation successful');
    return validation.data;
  } catch (error) {
    console.error(`❌ Error fetching event ${eventId}:`, error);
    return null;
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { id: eventId } = await params;

  console.log(`🔍 Loading event page for ID: ${eventId}`);

  // ✅ Get session
  const session = await getSession();

  // ✅ Check authentication
  if (!session.isLoggedIn || !session.user) {
    redirect(`/login?returnUrl=/dashboard/event/${eventId}`);
  }

  // ✅ Fetch event data
  const initialEvent = await getEventData(eventId);

  if (!initialEvent) {
    console.log(`❌ Event ${eventId} not found, showing 404`);
    notFound();
  }

  console.log('✅ Rendering EventDetailClient with event:', initialEvent.id);

  // ✅ Pass sessionUser prop
  return (
    <EventDetailClient 
      eventId={eventId} 
      initialEvent={initialEvent}
      sessionUser={session.user}
    />
  );
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: PageProps) {
  const { id: eventId } = await params;
  const event = await getEventData(eventId);

  if (!event) {
    return {
      title: "Evenement niet gevonden | Wish2Share",
    };
  }

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