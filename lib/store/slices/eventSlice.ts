// src/lib/store/slices/eventSlice.ts
import { StateCreator } from "zustand";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { toast } from "react-toastify";
import { StoreState } from "../types";
import { Event } from "@/types/event";
import { sanitizeEventUpdate } from "@/utils/eventUpdates";
import { useStore } from "@/store/useStore";

// --- Types ---
export interface EventSlice {
  events: Event[];
  loadEvents: () => Promise<void>;
  createEvent: (eventData: any) => Promise<string>;
  updateEvent: (eventId: string, data: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

// --- Implementation ---
export const createEventSlice: StateCreator<
  StoreState,
  [],
  [],
  EventSlice
> = (set, get) => ({
  events: [],

  // ---------------------------------------------------------
  // LOAD EVENTS (organizer + participant detection)
  // ---------------------------------------------------------
  loadEvents: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const activeProfileId = localStorage.getItem("activeProfile");
      const effectiveId =
        activeProfileId === "main-account" ? currentUser.id : activeProfileId;

      const eventsMap = new Map();

      // Query events created by user
      const organizerQuery = query(
        collection(db, "events"),
        where("organizer", "==", effectiveId)
      );

      // Load organizer events
      const organizerSnap = await getDocs(organizerQuery);
      organizerSnap.forEach((d) =>
        eventsMap.set(d.id, { id: d.id, ...d.data() })
      );

      // Query all events (only once)
      const allSnap = await getDocs(collection(db, "events"));
      allSnap.forEach((d) => {
        const data = d.data();
        const participants = data.participants || {};

        if (participants[effectiveId]) {
          eventsMap.set(d.id, { id: d.id, ...data });
        }
      });

      set({ events: Array.from(eventsMap.values()) });
    } catch (e) {
      console.error("Error loading events:", e);
      toast.error("Failed to load events");
    }
  },

  // ---------------------------------------------------------
  // CREATE EVENT
  // ---------------------------------------------------------
  createEvent: async (eventData: any) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error("Not authenticated");

    try {
      const eventId = crypto.randomUUID();
      const activeProfileId = localStorage.getItem("activeProfile");
      const organizer =
        activeProfileId === "main-account"
          ? currentUser.id
          : activeProfileId ?? currentUser.id;

      const participantsObject = Object.fromEntries(
        eventData.participants.map((p: any) => [
          p.id,
          {
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email ?? null,
            confirmed: p.confirmed ?? false,
            wishlistId: p.wishlistId ?? null,
          },
        ])
      );

      const eventDoc: Event = {
        id: eventId,
        name: eventData.name,
        profileId: organizer,
        date: eventData.date,
        time: eventData.time ?? null,
        budget: eventData.budget ?? 0,
        organizer,
        isLootjesEvent: eventData.isLootjesEvent ?? false,
        registrationDeadline: eventData.registrationDeadline ?? null,
        maxParticipants: eventData.maxParticipants ?? 1000,
        participants: participantsObject,
        backgroundImage:
          eventData.backgroundImage ||
          "/assets/defaults/event-background.jpg",
        messages: [],
        lastReadTimestamps: {},
        drawnNames: {},
        tasks: [],
        allowSelfRegistration: eventData.allowSelfRegistration ?? false,
        currentParticipantCount: Object.keys(participantsObject).length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "events", eventId), eventDoc);

      // Push local state instantly (UX boost)
      set((s) => ({ events: [...s.events, eventDoc] }));

      return eventId;
    } catch (e) {
      console.error("Create event error:", e);
      throw e;
    }
  },

  // ---------------------------------------------------------
  // UPDATE EVENT
  // ---------------------------------------------------------
  updateEvent: async (eventId, data) => {
    try {
      const sanitized = sanitizeEventUpdate(data);

      await updateDoc(doc(db, "events", eventId), {
        ...sanitized,
        updatedAt: serverTimestamp(),
      });

      // Reload events only once
      await useStore.getState().loadEvents();
    } catch (e) {
      console.error("Update event error:", e);
      toast.error("Event update failed");
      throw e;
    }
  },

  // ---------------------------------------------------------
  // DELETE EVENT
  // ---------------------------------------------------------
  deleteEvent: async (eventId) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      set((s) => ({ events: s.events.filter((e) => e.id !== eventId) }));
    } catch (e) {
      console.error("Delete event error:", e);
      toast.error("Delete failed");
    }
  },
});
