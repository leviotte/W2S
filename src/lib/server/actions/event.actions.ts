'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/actions';
import { z } from 'zod';

// Schema voor validatie van de input
const DeleteEventSchema = z.string().min(1, "Event ID is verplicht");

interface ActionResult {
    success: boolean;
    error?: string;
}

export async function deleteEventAction(eventId: string): Promise<ActionResult> {
    // 1. Valideer de input
    const validation = DeleteEventSchema.safeParse(eventId);
    if (!validation.success) {
        return { success: false, error: 'Ongeldig event ID.' };
    }

    // 2. Haal de sessie van de gebruiker op
    const session = await getSession();
    const userId = session.user?.id;

    if (!session.user?.isLoggedIn || !userId) {
        return { success: false, error: 'Authenticatie vereist.' };
    }

    try {
        const eventRef = adminDb.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return { success: false, error: 'Event niet gevonden.' };
        }

        const eventData = eventDoc.data();

        // 3. Essentiële security check: Is de gebruiker de eigenaar?
        if (eventData?.organizerId !== userId) {
            return { success: false, error: 'Geen toestemming om dit event te verwijderen.' };
        }

        // 4. Voer de verwijdering uit
        await eventRef.delete();

        // 5. Invalideer de cache voor de paden waar deze data getoond wordt
        // Dit zorgt ervoor dat Next.js de data opnieuw ophaalt bij het volgende bezoek.
        revalidatePath('/dashboard/past-events');
        revalidatePath(`/dashboard/event/${eventId}`); // Invalideer ook de detailpagina

        return { success: true };

    } catch (error) {
        console.error("Error deleting event:", error);
        return { success: false, error: 'Er is een serverfout opgetreden.' };
    }
}