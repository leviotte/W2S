// src/app/dashboard/wishlists/create/actions.ts
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
  items: z.string().transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);
      return z.array(wishlistItemSchema).parse(parsed);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: 'Ongeldig itemformaat.' });
      return z.NEVER;
    }
  }),
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

/**
 * ✅ FORM ACTION - Gebruikt met useFormState
 * Hernoemt van createWishlistAction → createWishlistFormAction
 */
export async function createWishlistFormAction(
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
      isPublic: false,
      ownerId: session.user.id,
      ownerName: session.user.displayName || `${session.user.firstName} ${session.user.lastName}`,
      participantIds: [session.user.id],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      backgroundImage: backgroundImage || 'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media',
      description: null,
      slug: null,
      eventDate: null,
      category: undefined,
      tags: [],
      sharedWith: [],
      profileId: null,
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
          const updateField = `participants.${participantKey}.wishlistId`;
          await eventRef.update({ [updateField]: newWishlistId });
          
          revalidatePath(`/dashboard/event/${eventId}`);
          revalidatePath('/dashboard/wishlists');
          
          redirect(`/dashboard/event/${eventId}`);
        }
      }
    }

    revalidatePath('/dashboard/wishlists');
  } catch (error) {
    console.error('Fout bij aanmaken wishlist:', error);
    return {
      success: false,
      message: 'Er is een serverfout opgetreden. Probeer het later opnieuw.',
    };
  }

  redirect('/dashboard/wishlists');
}

// ✅ BACKWARDS COMPATIBILITY: Alias voor oude code
export const createWishlistAction = createWishlistFormAction;