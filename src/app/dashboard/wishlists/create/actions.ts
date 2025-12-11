'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { wishlistItemSchema } from '@/types/wishlist';

// Schema voor de formuliervalidatie op de server
const CreateWishlistFormSchema = z.object({
  wishlistName: z.string().min(3, 'De naam moet minstens 3 tekens lang zijn.'),
  backgroundImage: z.string().url().or(z.literal('')),
  // We ontvangen de items als een JSON-string vanuit een hidden input
  items: z.string().transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);
      // Valideer dat de geparste data een array van WishlistItems is
      return z.array(wishlistItemSchema).parse(parsed);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: 'Ongeldig itemformaat.' });
      return z.NEVER;
    }
  }),
  // Optionele velden voor als we vanuit een event komen
  eventId: z.string().optional(),
  participantId: z.string().optional(),
});

export interface CreateWishlistFormState {
  success: boolean;
  message: string;
  errors?: {
    wishlistName?: string[];
    backgroundImage?: string[];
    items?: string[];
    _form?: string[];
  };
}

export async function createWishlistAction(
  prevState: CreateWishlistFormState,
  formData: FormData
): Promise<CreateWishlistFormState> {
  const session = await getSession();
  if (!session.user) {
    return { success: false, message: 'Niet geautoriseerd.' };
  }

  const validatedFields = CreateWishlistFormSchema.safeParse({
    wishlistName: formData.get('wishlistName'),
    backgroundImage: formData.get('backgroundImage'),
    items: formData.get('items'),
    eventId: formData.get('eventId'),
    participantId: formData.get('participantId'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validatie mislukt. Controleer de velden.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { wishlistName, backgroundImage, items, eventId, participantId } = validatedFields.data;

  try {
    // 1. Maak de nieuwe wishlist aan in de 'wishlists' collectie
    const newWishlistRef = await adminDb.collection('wishlists').add({
      name: wishlistName,
      items: items,
      isPublic: false, // Standaard privé
      ownerId: session.user.id,
      participantIds: [session.user.id],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      backgroundImage: backgroundImage || 'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media',
    });

    const newWishlistId = newWishlistRef.id;

    // 2. Als de wishlist is aangemaakt vanuit een event, update het event
    if (eventId && participantId) {
      const eventRef = adminDb.collection('events').doc(eventId);
      const eventDoc = await eventRef.get();

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        const participants = eventData?.participants || {};
        const participantKey = Object.keys(participants).find(
          (key) => participants[key].id === participantId
        );

        if (participantKey) {
          // Update de wishlistId voor de specifieke deelnemer
          const updateField = `participants.${participantKey}.wishlistId`;
          await eventRef.update({ [updateField]: newWishlistId });
          
          // Revalideer de event pagina en de wishlists pagina
          revalidatePath(`/dashboard/events/${eventId}`);
          revalidatePath('/dashboard/wishlists');
          
          // Stuur de gebruiker terug naar de event pagina
          redirect(`/dashboard/events/${eventId}`);
        }
      }
    }

    // Revalideer de algemene wishlists pagina
    revalidatePath('/dashboard/wishlists');
  } catch (error) {
    console.error('Fout bij aanmaken wishlist:', error);
    return {
      success: false,
      message: 'Er is een serverfout opgetreden. Probeer het later opnieuw.',
    };
  }

  // Als alles goed ging en er was geen redirect, stuur naar de wishlists pagina
  redirect('/dashboard/wishlists');
}