// src/lib/server/data/events.ts
import 'server-only';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/server/firebase-admin';
import { eventSchema, type Event } from '@/types/event';
import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * ✅ RECURSIVE Firestore Timestamp converter
 * Converts ALL Firestore Timestamps to ISO strings (for Client Components)
 */
function convertFirestoreTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Check if it's a Firestore Timestamp
  if (obj && typeof obj === 'object' && '_seconds' in obj && '_nanoseconds' in obj) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
  }
  
  // Firestore Timestamp object (has toDate method)
  if (obj?.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
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

// ✅ GEFIXTE serializeDoc - gebruikt nu recursive converter!
function serializeDoc(doc: admin.firestore.DocumentSnapshot): Record<string, any> | null {
  const data = doc.data();
  if (!data) return null;

  // ✅ Convert ALL nested timestamps recursively!
  const serialized = convertFirestoreTimestamps(data);
  
  return { id: doc.id, ...serialized };
}

// ============================================================================
// EVENT FETCHING - SINGLE EVENT
// ============================================================================

export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) return null;
    
    const serialized = serializeDoc(eventDoc);
    if (!serialized) return null;

    // ✅ Convert participants before validation
    const convertedEvent = {
      ...serialized,
      participants: serialized.participants 
        ? Object.entries(serialized.participants).map(([id, participant]: [string, any]) => ({
            id,
            firstName: participant.firstName || '',
            lastName: participant.lastName || '',
            email: participant.email || '',
            role: participant.role || 'participant',
            status: participant.status || 'pending',
            addedAt: participant.addedAt || new Date().toISOString(),
          }))
        : [],
    };
    
    const parsedEvent = eventSchema.safeParse(convertedEvent);

    if (!parsedEvent.success) {
      console.error(`Zod validation failed for event ${eventId}:`, parsedEvent.error.flatten());
      return null;
    }
    return parsedEvent.data;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    return null;
  }
}

// ============================================================================
// EVENT FETCHING - USER EVENTS (✅ GEFIXED - PARTICIPANTS CONVERSIE!)
// ============================================================================

export async function getEventsForUser(userId: string, profileId?: string): Promise<Event[]> {
  if (!userId) {
    console.log('❌ No userId provided');
    return [];
  }
  
  console.log('🟢 === getEventsForUser START ===');
  console.log('🟢 Input userId:', userId);
  console.log('🟢 Input profileId:', profileId);
  
  try {
    const eventsRef = adminDb.collection('events');
    
    // Determine effective organizer ID
    const effectiveOrganizerId = profileId === 'main-account' || !profileId 
      ? userId 
      : profileId;

    console.log('🟢 effectiveOrganizerId:', effectiveOrganizerId);

    // ✅ Query op 'organizer' field (niet 'organizerId')!
    const organizerQuery = eventsRef.where('organizer', '==', effectiveOrganizerId);
    const organizerSnapshot = await organizerQuery.get();
    
    console.log('🟢 Organizer query results:', organizerSnapshot.size);
    organizerSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('🟢   - Event found as organizer:', {
        id: doc.id,
        name: data.name,
        organizer: data.organizer,
      });
    });
    
    // Get ALL events for participant check
    const allEventsSnapshot = await eventsRef.get();
    console.log('🟢 Total events in database:', allEventsSnapshot.size);
    
    // Log first event structure
    if (allEventsSnapshot.size > 0) {
      const firstEvent = allEventsSnapshot.docs[0].data();
      console.log('🟢 Sample event structure:', {
        id: allEventsSnapshot.docs[0].id,
        name: firstEvent.name,
        organizer: firstEvent.organizer,
        hasParticipants: !!firstEvent.participants,
        participantKeys: firstEvent.participants ? Object.keys(firstEvent.participants) : [],
      });
    }
    
    const eventsMap = new Map<string, any>();
    
    // Add organizer events
    organizerSnapshot.docs.forEach(doc => {
      const serialized = serializeDoc(doc);
      if (serialized) {
        eventsMap.set(doc.id, serialized);
        console.log('✅ Added event as organizer:', doc.id);
      }
    });
    
    // Add participant events (manual check - BACKWARD COMPATIBLE!)
    allEventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const participants = data.participants || {};
      
      // Check if userId is in participants object
      const participantIds = Object.keys(participants);
      const isParticipant = participantIds.some(pId => {
        const participant = participants[pId];
        return pId === userId || 
               pId === profileId || 
               participant?.id === userId || 
               participant?.id === profileId;
      });
      
      if (isParticipant && !eventsMap.has(doc.id)) {
        const serialized = serializeDoc(doc);
        if (serialized) {
          eventsMap.set(doc.id, serialized);
          console.log('✅ Added event as participant:', doc.id);
        }
      }
    });
    
    console.log('📦 Total unique events found:', eventsMap.size);
    
    // ✅ CRITICAL FIX: Parse & validate met participants conversie!
    const events: Event[] = [];
    
    for (const eventData of eventsMap.values()) {
      try {
        // ✅ Convert participants Record<string, EventParticipant> → EventParticipant[]
        const convertedEventData = {
          ...eventData,
          participants: eventData.participants 
            ? Object.entries(eventData.participants).map(([id, participant]: [string, any]) => ({
                id,
                firstName: participant.firstName || '',
                lastName: participant.lastName || '',
                email: participant.email || '',
                role: participant.role || 'participant',
                status: participant.status || 'pending',
                addedAt: participant.addedAt || new Date().toISOString(),
              }))
            : [],
        };
        
        const parsed = eventSchema.safeParse(convertedEventData);
        
        if (parsed.success) {
          events.push(parsed.data);
          console.log('✅ Event validated:', parsed.data.id, parsed.data.name);
        } else {
          console.warn('⚠️ Event validation failed:', eventData.id, parsed.error.flatten());
        }
      } catch (conversionError: any) {
        console.error('❌ Event conversion error:', eventData.id, conversionError.message);
      }
    }
    
    // Sort by date (newest first)
    const sortedEvents = events.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    console.log('🎉 Final events count:', sortedEvents.length);
    
    return sortedEvents;

  } catch (error) {
    console.error('❌ Error fetching events for user:', error);
    return [];
  }
}

// ============================================================================
// EVENT COUNTS - UPCOMING & PAST
// ============================================================================

export async function getEventCountsForUser(userId: string): Promise<{
  upcoming: number;
  past: number;
}> {
  if (!userId) {
    return { upcoming: 0, past: 0 };
  }

  try {
    const events = await getEventsForUser(userId);
    const now = new Date();

    const upcoming = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now;
    }).length;

    const past = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate < now;
    }).length;

    console.log(`📊 Event counts for ${userId}: ${upcoming} upcoming, ${past} past`);

    return { upcoming, past };

  } catch (error) {
    console.error(`❌ Error fetching event counts for user ${userId}:`, error);
    return { upcoming: 0, past: 0 };
  }
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

export function getEventCacheTags(userId: string): string[] {
  return [
    `user-events:${userId}`,
    `event-counts:${userId}`,
  ];
}