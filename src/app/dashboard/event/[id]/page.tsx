import { notFound } from "next/navigation";
import { getAuthedUser } from "@/lib/auth/actions";
import { adminDb } from "@/lib/server/firebase-admin";
import type { Event, EventParticipant } from "@/types/event";
import { eventSchema } from "@/types/event";
import type { Wishlist } from "@/types/wishlist";
import { WishlistSchema } from "@/types/wishlist";
import EventDashboardClient from "./_components/event-dashboard-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

async function getEventData(eventId: string): Promise<Event | null> {
  const eventRef = adminDb.collection("events").doc(eventId);
  const docSnap = await eventRef.get();

  if (!docSnap.exists) return null;

  const data = { ...docSnap.data(), id: docSnap.id };
  const validation = eventSchema.safeParse(data);

  if (!validation.success) {
    console.error(`Event data validation failed for ID ${eventId}:`, validation.error.flatten());
    return null;
  }
  return validation.data;
}

async function getWishlistsData(participants: EventParticipant[]): Promise<Record<string, Wishlist>> {
  const wishlistIds = participants.map(p => p.wishlistId).filter(Boolean) as string[];
  if (wishlistIds.length === 0) return {};

  const wishlistRefs = wishlistIds.map(id => adminDb.collection('wishlists').doc(id));
  const wishlistDocs = await adminDb.getAll(...wishlistRefs);

  const wishlists: Record<string, Wishlist> = {};
  for (const doc of wishlistDocs) {
    if (doc.exists) {
      const validation = WishlistSchema.safeParse({ ...doc.data(), id: doc.id });
      if (validation.success) {
        wishlists[doc.id] = validation.data;
      }
    }
  }
  return wishlists;
}

export default async function EventDashboardPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  
  // ✅ Gebruik getAuthedUser() voor type-safe auth check
  const authedUser = await getAuthedUser();
  
  if (!authedUser) {
    // Niet ingelogd - redirect naar login met return URL
    redirect(`/login?returnUrl=/dashboard/events/${eventId}`);
  }
  
  const initialEvent = await getEventData(eventId);
  
  if (!initialEvent) {
    notFound();
  }

  const participants = Object.values(initialEvent.participants);
  const wishlists = await getWishlistsData(participants);

  return (
    <EventDashboardClient 
      event={initialEvent}
      participants={participants}
      wishlists={wishlists}
      // ✅ Pass de volledige profile (type-safe!)
      currentUser={authedUser.profile} 
      currentUserId={authedUser.profile.id}
      isOrganizer={initialEvent.organizerId === authedUser.profile.id}
      drawnParticipantId={initialEvent.drawnNames?.[authedUser.profile.id]}
    />
  );
}