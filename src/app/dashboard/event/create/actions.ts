'use server';

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { revalidatePath } from 'next/cache';

export interface FormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
  eventId?: string;
}

// ** DE FIX **: De ongeldige 'invalid_type_error' parameter is verwijderd.
const eventActionSchema = z.object({
  name: z.string().min(3, { message: "Naam moet minimaal 3 karakters lang zijn."}),
  date: z.coerce.date(), // Dit is nu correct.
  description: z.string().optional(),
  organizerProfileId: z.string().min(1, { message: "Organisator profiel is verplicht."}),
  organizerEmail: z.string().email(),
  drawNames: z.preprocess((val) => val === 'on', z.boolean()),
});

export async function createEventAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Authenticatie vereist." };
  }

  const validatedFields = eventActionSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validatie mislukt. Controleer de ingevulde velden.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, date, description, organizerProfileId, organizerEmail, drawNames } = validatedFields.data;

  try {
    const organizerProfileRef = await adminDb.collection('users').doc(organizerProfileId).get();
    if (!organizerProfileRef.exists) {
      return { success: false, message: 'Geselecteerd organisatorprofiel niet gevonden.' };
    }
    const organizerProfileData = organizerProfileRef.data()!;

    const newEvent = {
      name,
      date,
      description: description ?? '',
      drawNames,
      organizerId: organizerProfileId,
      organizer: {
        id: organizerProfileId,
        firstName: organizerProfileData.firstName || '',
        lastName: organizerProfileData.lastName || '',
        email: organizerEmail,
      },
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('events').add(newEvent);

    revalidatePath('/dashboard/upcoming');
    revalidatePath(`/dashboard/event/${docRef.id}`);

    return { success: true, message: "Evenement succesvol aangemaakt!", eventId: docRef.id };

  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, message: "Er is een onbekende fout opgetreden." };
  }
}