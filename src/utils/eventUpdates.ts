import { collection, getDocs } from "firebase/firestore";
import { Event } from "@/src/types/event";
import { db } from "@/src/lib/firebase";

/**
 * Sanitize partial Event updates to prevent Firestore errors
 */
export const sanitizeEventUpdate = (data: Partial<Event>) => {
  const sanitized = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {} as Record<string, any>);

  // Ensure arrays and objects
  if ("messages" in sanitized && !Array.isArray(sanitized.messages)) sanitized.messages = [];
  if ("lastReadTimestamps" in sanitized && typeof sanitized.lastReadTimestamps !== "object")
    sanitized.lastReadTimestamps = {};
  if ("drawnNames" in sanitized && typeof sanitized.drawnNames !== "object") sanitized.drawnNames = {};
  if ("participants" in sanitized && typeof sanitized.participants !== "object") sanitized.participants = {};

  // Ensure messages have required fields
  if ("messages" in sanitized && Array.isArray(sanitized.messages)) {
    sanitized.messages = sanitized.messages.map((message: any) => ({
      id: message.id || crypto.randomUUID(),
      text: message.text || "",
      userId: message.userId,
      userName: message.userName,
      timestamp: message.timestamp || new Date().toISOString(),
      isAnonymous: message.isAnonymous || false,
      gifUrl: message.gifUrl || null,
    }));
  }

  return sanitized;
};

/**
 * Count events a user has participated in
 */
export async function getParticipatedEventCount(
  userId: string,
  callback: (data: { onGoing: number; all: number }) => void
): Promise<void> {
  try {
    const now = new Date();
    const eventsRef = collection(db, "events");
    const querySnapshot = await getDocs(eventsRef);

    const participatedEvents = querySnapshot.docs.filter((doc) => {
      const data = doc.data() as Event;
      return data.participants && Object.keys(data.participants).includes(userId);
    });

    const onGoingEvents = participatedEvents.filter((doc) => {
      const data = doc.data() as Event;
      const date = new Date(data.date);
      return date >= now;
    });

    callback({ onGoing: onGoingEvents.length, all: participatedEvents.length });
  } catch (error) {
    console.error("Error fetching participated event count:", error);
  }
}

/**
 * Count events a user has organized or participated in
 */
export async function getOrganizedEventCount(
  userId: string,
  isProfile: boolean,
  callback: (data: { onGoing: number; past?: number; all: number }) => void
): Promise<void> {
  try {
    const eventsRef = collection(db, "events");
    const snapshot = await getDocs(eventsRef);
    const now = new Date();

    let onGoing = 0;
    let past = 0;
    let total = 0;

    snapshot.forEach((doc) => {
      const event = doc.data() as Event;

      const isOrganizer = event.organizer === userId;
      const isParticipant =
        event.participants &&
        Object.values(event.participants).some((participant: any) => {
          return participant?.id === userId || participant?.profileId === userId;
        });

      if (isOrganizer || isParticipant) {
        total++;
        const eventDate = new Date(event.date);
        if (eventDate >= now) onGoing++;
        else past++;
      }
    });

    callback({ onGoing, past, all: total });
  } catch (error) {
    console.error("Error fetching organized events count:", error);
    throw error;
  }
}
