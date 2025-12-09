// src/app/dashboard/event/create/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUserProfile } from "@/lib/auth/actions";
import { adminDb } from "@/lib/server/firebase-admin";
import type { Event, EventParticipant } from "@/types/event";
import { Timestamp } from "firebase-admin/firestore";

// Zod schema voor server-side validatie
const actionSchema = z.object({
  name: z.string().min(3, "Naam moet minimaal 3 karakters lang zijn."),
  date: z.date({
    required_error: "Een datum is verplicht.",
    invalid_type_error: "Ongeldige datum.",
  }),
  description: z.string().optional(),
  drawNames: z.boolean().default(false),
  organizer: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
  })
});

export type FormState = {
    success: boolean;
    message: string;
    eventId?: string;
    errors?: Record<string, string[] | undefined>;
};

export async function createEventAction(
  prevState: FormState,
  data: z.infer<typeof actionSchema>
): Promise<FormState> {
  const user = await getAuthenticatedUserProfile();
  if (!user) {
    return { success: false, message: "Authenticatie mislukt." };
  }

  const validatedFields = actionSchema.safeParse(data);
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validatie mislukt. Controleer de ingevulde velden.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, date, description, drawNames, organizer } = validatedFields.data;

  // Maak de organisator de eerste deelnemer
  const initialParticipant: EventParticipant = {
      ...organizer,
      photoURL: user.photoURL, // Neem de photoURL van de user mee
      confirmed: true,
  };

  // Bouw de participants Record
  const participantsRecord: Record<string, EventParticipant> = {
    [organizer.id]: initialParticipant,
  };

  const newEventData = {
    name,
    description: description || "",
    organizerId: organizer.id,
    organizerName: `${organizer.firstName} ${organizer.lastName}`,
    
    // Converteer naar Firestore Timestamps!
    date: Timestamp.fromDate(date),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),

    // Gebruik de correcte data structuur
    participants: participantsRecord,
    participantIds: [organizer.id],

    drawNames,
    status: 'active' as const,
    isPublic: false,
    drawn: false,
    tasks: [],
  };

  try {
    const eventRef = await adminDb.collection("events").add(newEventData);
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/upcoming");

    return {
      success: true,
      message: `Evenement '${name}' is aangemaakt!`,
      eventId: eventRef.id,
    };
  } catch (error) {
    console.error("Fout bij het aanmaken van evenement:", error);
    return {
      success: false,
      message: "Een onverwachte serverfout is opgetreden.",
    };
  }
}