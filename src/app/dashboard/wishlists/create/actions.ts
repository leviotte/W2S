// src/app/dashboard/wishlists/create/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { wishlistItemSchema } from '@/types/wishlist';

// ✅ VERBETERD SCHEMA - Accepteert null/undefined
const CreateWishlistFormSchema = z.object({
  wishlistName: z.string().min(3, 'De naam moet minstens 3 tekens lang zijn.'),
  backgroundImage: z
    .string()
    .url('Ongeldige achtergrond URL')
    .or(z.literal(''))
    .nullable()
    .optional()
    .transform(val => val || ''),
  items: z.string().transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);
      const validated = z.array(wishlistItemSchema).parse(parsed);
      
      if (validated.length === 0) {
        ctx.addIssue({ 
          code: 'custom', 
          message: 'Voeg minstens één item toe aan je wishlist.' 
        });
        return z.NEVER;
      }
      
      return validated;
    } catch (e) {
      console.error('Items parse error:', e);
      ctx.addIssue({ 
        code: 'custom', 
        message: e instanceof Error ? e.message : 'Ongeldig itemformaat.' 
      });
      return z.NEVER;
    }
  }),
  eventId: z.string().nullable().optional(),
  participantId: z.string().nullable().optional(),
});

export interface CreateWishlistFormState {
  success: boolean;
  message: string;
  errors?: {
    wishlistName?: string[];
    backgroundImage?: string[];
    items?: string[];
    eventId?: string[];
    participantId?: string[];
    _form?: string[];
  };
  wishlistId?: string;
}

/**
 * ✅ FORM ACTION - Gebruikt met useFormState
 */
export async function createWishlistFormAction(
  prevState: CreateWishlistFormState,
  formData: FormData
): Promise<CreateWishlistFormState> {
  // ✅ LOG INCOMING DATA
  console.log('=== CREATE WISHLIST ACTION ===');
  console.log('FormData entries:');
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}:`, typeof value === 'string' ? value.substring(0, 100) : value);
  }

  const session = await getSession();
  if (!session.user) {
    return { 
      success: false, 
      message: 'Niet geautoriseerd.',
      errors: { _form: ['Je moet ingelogd zijn om een wishlist te maken.'] }
    };
  }

  // ✅ PARSE EN VALIDEER
  const rawData = {
    wishlistName: formData.get('wishlistName'),
    backgroundImage: formData.get('backgroundImage'),
    items: formData.get('items'),
    eventId: formData.get('eventId'),
    participantId: formData.get('participantId'),
  };

  console.log('Raw data:', rawData);

  const validatedFields = CreateWishlistFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error.flatten());
    
    return {
      success: false,
      message: 'Validatie mislukt. Controleer de velden.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { wishlistName, backgroundImage, items, eventId, participantId } = validatedFields.data;

  console.log('Validated data:', { wishlistName, backgroundImage, itemCount: items.length, eventId, participantId });

  try {
    // ✅ DEFAULT BACKGROUND IMAGE
    const defaultBackground = 'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media';

    // 1. Maak de nieuwe wishlist aan in de 'wishlists' collectie
    const wishlistData = {
      name: wishlistName,
      items: items,
      isPublic: false,
      ownerId: session.user.id,
      ownerName: session.user.displayName || `${session.user.firstName} ${session.user.lastName}`,
      participantIds: [session.user.id],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      backgroundImage: backgroundImage || defaultBackground,
      description: null,
      slug: null,
      eventDate: null,
      category: undefined,
      tags: [],
      sharedWith: [],
      profileId: null,
    };

    console.log('Creating wishlist with data:', wishlistData);

    const newWishlistRef = await adminDb.collection('wishlists').add(wishlistData);
    const newWishlistId = newWishlistRef.id;

    console.log('Wishlist created with ID:', newWishlistId);

    // 2. Als de wishlist is aangemaakt vanuit een event, update het event
    if (eventId && participantId) {
      console.log('Updating event:', eventId, 'for participant:', participantId);
      
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
          
          console.log('Event updated, redirecting to event page');
          
          revalidatePath(`/dashboard/event/${eventId}`);
          revalidatePath('/dashboard/wishlists');
          
          redirect(`/dashboard/event/${eventId}`);
        } else {
          console.warn('Participant not found in event');
        }
      } else {
        console.warn('Event not found:', eventId);
      }
    }

    // 3. Standaard redirect naar wishlists overzicht
    console.log('Wishlist created successfully, redirecting to wishlists');
    revalidatePath('/dashboard/wishlists');
    redirect('/dashboard/wishlists');

  } catch (error) {
    // ✅ Check of het een redirect error is (dat is normaal in Next.js)
    if (error && typeof error === 'object' && 'digest' in error) {
      // Dit is een Next.js redirect, laat het door
      throw error;
    }

    console.error('Fout bij aanmaken wishlist:', error);
    return {
      success: false,
      message: 'Er is een serverfout opgetreden. Probeer het later opnieuw.',
      errors: { 
        _form: [error instanceof Error ? error.message : 'Onbekende fout'] 
      },
    };
  }
}

// ✅ BACKWARDS COMPATIBILITY
export const createWishlistAction = createWishlistFormAction;