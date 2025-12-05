'use server'; // Server Actions draaien altijd op de server

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/server/firebaseAdmin";
import { getCurrentUser } from "@/lib/server/auth"; // We gebruiken jouw superieure functie!

// State-definitie voor useFormState
export interface FormState {
  success: boolean;
  message: string;
  eventId?: string;
  errors?: Record<string, string[]>;
}

// Zod schema voor validatie op de server
const formSchema = z.object({
    name: z.string().min(1, "Naam van het evenement is verplicht"),
    date: z.string().min(1, "Datum is verplicht"),
    time: z.string().optional(),
    backgroundImage: z.string().optional(),
    budget: z.coerce.number().positive().optional(),
    isLootjesEvent: z.boolean().default(false),
    registrationDeadline: z.string().optional().nullable(),
    participantType: z.enum(["manual", "self-register"]).default("manual"),
    maxParticipants: z.coerce.number().positive().optional(),
    // We verwachten dat de participants als een JSON string binnenkomen van het verborgen veld
    participants: z.string().transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        ctx.addIssue({ code: 'custom', message: 'Invalid participants format' });
        return z.NEVER;
      }
    }).pipe(z.array(
        z.object({
          id: z.string(),
          firstName: z.string().min(1, "Voornaam is verplicht"),
          lastName: z.string().min(1, "Achternaam is verplicht"),
          email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
          confirmed: z.boolean(),
        })
    )),
});


// De Server Action
export async function createEventAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    
  // 1. Haal de ingelogde gebruiker op via de sessie-cookie
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Authenticatie mislukt. Log opnieuw in." };
  }

  // 2. Converteer FormData naar een object en valideer met Zod
  const rawData = Object.fromEntries(formData.entries());
  
  // Speciale behandeling voor de checkbox
  const dataToValidate = {
    ...rawData,
    isLootjesEvent: rawData.isLootjesEvent === "on",
  };

  const validationResult = formSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    // Log de fouten voor debugging
    console.error("Server Action Validation Errors:", validationResult.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Validatie mislukt. Controleer de ingevoerde gegevens.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }
  
  const data = validationResult.data;

  try {
    // 3. Bouw het Firestore-document op
    const eventRef = db.collection("events").doc();
    
    const eventData = {
      name: data.name,
      organizerId: user.uid, // Gebruik de uid van de AppUser
      date: new Date(`${data.date}T${data.time || '00:00:00'}`),
      createdAt: new Date(),
      backgroundImage: data.backgroundImage || "",
      budget: data.budget || null,
      isLootjesEvent: data.isLootjesEvent,
      participantType: data.participantType,
      maxParticipants: data.maxParticipants || null,
      drawnNames: {}, 
      participants: data.participants.map((p, index) => ({
        id: p.id,
        name: `${p.firstName.trim()} ${p.lastName.trim()}`,
        email: p.email || "",
        status: index === 0 ? "accepted" : "pending",
      })),
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
    };
    
    // 4. Schrijf naar Firestore
    await eventRef.set(eventData);

    // 5. Revalidate het pad om de UI te updaten en succes terug te geven
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    
    return {
      success: true,
      message: "Evenement succesvol aangemaakt!",
      eventId: eventRef.id,
    };
  } catch (error) {
    console.error("Firestore Error creating event:", error);
    return {
      success: false,
      message: "Er is een fout opgetreden bij het aanmaken van het evenement in de database.",
    };
  }
}