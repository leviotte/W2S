// src/app/dashboard/event/[id]/page.tsx
import { notFound } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";

import type { Event, EventParticipant } from "@/types/event";
import { eventSchema } from "@/types/event";
import type { Wishlist } from "@/types/wishlist";
import { WishlistSchema } from "@/types/wishlist";
import type { AuthedUser } from "@/types/user";
import { SessionUserSchema } from "@/types/user";

// FIX: 'default' import gebruiken omdat EventDashboardClient een default export is.
import EventDashboardClient from "./_components/event-dashboard-client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// FIX: Volledige implementatie van de data-fetching functies.
async function getEventData(eventId: string): Promise<Event | null> {
  const eventRef = adminDb.collection("events").doc(eventId);
  const docSnap = await eventRef.get();

  if (!docSnap.exists) {
    return null;
  }

  const data = { ...docSnap.data(), id: docSnap.id };
  const validation = eventSchema.safeParse(data);

  if (!validation.success) {
    console.error(`Server-side event data validation failed for ID ${eventId}:`, validation.error.flatten());
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

export default async function EventDashboardPage({ params }: { params: { id: string }}) {
  const eventId = params.id;
  const session = await getSession();

  let validatedUser: AuthedUser | null = null;
  
  // FIX: De 'isLoggedIn' en 'user' properties bestaan direct op het session object van getSession().
  if (session.isLoggedIn && session.user) {
    const profileValidation = SessionUserSchema.safeParse(session.user);
    if (profileValidation.success) {
      const profile = profileValidation.data;
      validatedUser = {
        isLoggedIn: true,
        id: profile.id,
        email: profile.email,
        profile: profile,
      };
    } else {
        console.error("Server-side session.user validation failed:", profileValidation.error.flatten());
    }
  }
  
  if (!validatedUser) {
    // Hier kun je later een redirect naar /login doen.
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
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
      currentUser={validatedUser}
      currentUserId={validatedUser.profile.id}
      isOrganizer={initialEvent.organizerId === validatedUser.profile.id}
      drawnParticipantId={initialEvent.drawnNames?.[validatedUser.profile.id]}
    />
  );
}