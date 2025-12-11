import { notFound, redirect } from "next/navigation"; // ✅ GEFIXED - beide imports
import { getSession } from "@/lib/auth/session"; // ✅ GEFIXED - gebruik getSession
import { adminDb } from "@/lib/server/firebase-admin";
import type { Event, EventParticipant } from "@/types/event";
import { eventSchema } from "@/types/event";
import type { Wishlist } from "@/types/wishlist";
import { wishlistSchema } from "@/types/wishlist";
import EventDashboardClient from "./_components/event-dashboard-client";

// ============================================================================
// SERVER ACTIONS - DATA FETCHING
// ============================================================================

async function getEventData(eventId: string): Promise<Event | null> {
  try {
    const eventRef = adminDb.collection("events").doc(eventId);
    const docSnap = await eventRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = { ...docSnap.data(), id: docSnap.id };
    const validation = eventSchema.safeParse(data);

    if (!validation.success) {
      console.error(
        `Event data validation failed for ID ${eventId}:`,
        validation.error.flatten()
      );
      return null;
    }

    return validation.data;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    return null;
  }
}

async function getWishlistsData(
  participants: EventParticipant[]
): Promise<Record<string, Wishlist>> {
  try {
    const wishlistIds = participants
      .map((p) => p.wishlistId)
      .filter(Boolean) as string[];

    if (wishlistIds.length === 0) {
      return {};
    }

    const wishlistRefs = wishlistIds.map((id) =>
      adminDb.collection("wishlists").doc(id)
    );
    const wishlistDocs = await adminDb.getAll(...wishlistRefs);

    const wishlists: Record<string, Wishlist> = {};

    for (const doc of wishlistDocs) {
      if (doc.exists) {
        const validation = wishlistSchema.safeParse({
          ...doc.data(),
          id: doc.id,
        });

        if (validation.success) {
          wishlists[doc.id] = validation.data;
        } else {
          console.warn(
            `Wishlist validation failed for ID ${doc.id}:`,
            validation.error.flatten()
          );
        }
      }
    }

    return wishlists;
  } catch (error) {
    console.error("Error fetching wishlists:", error);
    return {};
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDashboardPage({ params }: PageProps) {
  // ✅ Await params (Next.js 15+ requirement)
  const { id: eventId } = await params;

  // ✅ Get session met nieuwe session.ts
  const session = await getSession();

  // ✅ Check authentication
  if (!session.isLoggedIn || !session.user) {
    redirect(`/login?returnUrl=/dashboard/event/${eventId}`);
  }

  const currentUser = session.user;

  // ✅ Fetch event data
  const initialEvent = await getEventData(eventId);

  if (!initialEvent) {
    notFound();
  }

  // ✅ Fetch participants & wishlists
  const participants = Object.values(initialEvent.participants);
  const wishlists = await getWishlistsData(participants);

  // ✅ Check if user is organizer
  const isOrganizer = initialEvent.organizerId === currentUser.id;

  // ✅ Check if user has a drawn participant (voor lootjes)
  const drawnParticipantId = initialEvent.drawnNames?.[currentUser.id];

  return (
    <EventDashboardClient
      event={initialEvent}
      participants={participants}
      wishlists={wishlists}
      // ✅ Pass current user data (SessionUser interface)
      currentUser={{
        id: currentUser.id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      }}
      currentUserId={currentUser.id}
      isOrganizer={isOrganizer}
      drawnParticipantId={drawnParticipantId}
    />
  );
}

// ============================================================================
// METADATA (OPTIONAL - VOOR SEO)
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