// src/app/dashboard/wishlists/create/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { wishlistItemSchema } from '@/types/wishlist';

// Schema voor veilige validatie
const CreateWishlistFormSchema = z.object({
  wishlistName: z.string().min(1).max(100),
  backgroundImage: z.string().optional().nullable().transform(val => val || ''),
  items: z.string().min(1).transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({ code: 'custom', message: 'Items moet een array zijn.' });
        return z.NEVER;
      }
      if (parsed.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Voeg minstens één item toe.' });
        return z.NEVER;
      }
      return z.array(wishlistItemSchema).parse(parsed);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: 'Ongeldig itemformaat.' });
      return z.NEVER;
    }
  }),
  eventId: z.string().optional().nullable(),
  participantId: z.string().optional().nullable(),
});

export interface CreateWishlistFormState {
  success: boolean;
  message: string;
  errors?: { [field: string]: string[] };
  wishlistId?: string;
}

function generateSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createWishlistFormAction(
  prevState: CreateWishlistFormState,
  formData: FormData
): Promise<CreateWishlistFormState> {
  const session = await getSession();
  if (!session.user) {
    return { success: false, message: 'Niet geautoriseerd.', errors: { _form: ['Je moet ingelogd zijn.'] } };
  }
  const rawData = {
    wishlistName: formData.get('wishlistName'),
    backgroundImage: formData.get('backgroundImage'),
    items: formData.get('items'),
    eventId: formData.get('eventId'),
    participantId: formData.get('participantId'),
  };
  const validatedFields = CreateWishlistFormSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return { success: false, message: 'Validatie mislukt.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { wishlistName, backgroundImage, items, eventId, participantId } = validatedFields.data;

  try {
    const defaultBackground = 'https://firebasestorage.googleapis.com/....Standaard%20achtergrond%20Event.jpg?alt=media';
    // Genereer een unieke slug
    let baseSlug = generateSlug(wishlistName);
    let slug = baseSlug;
    const existingSnap = await adminDb.collection('wishlists').where('slug', '==', slug).limit(1).get();
    if (!existingSnap.empty) slug = `${baseSlug}-${Date.now()}`;

    const wishlistData = {
      name: wishlistName,
      items,
      isPublic: false,
      ownerId: session.user.id,
      userId: session.user.id,
      ownerName: session.user.displayName || [session.user.firstName, session.user.lastName].filter(Boolean).join(' '),
      participantIds: [session.user.id],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      backgroundImage: backgroundImage || defaultBackground,
      description: "",
      slug,
      eventDate: null,
      category: undefined,
      tags: [],
      sharedWith: [],
      profileId: null,
    };

    const newWishlistRef = await adminDb.collection('wishlists').add(wishlistData);
    const newWishlistId = newWishlistRef.id;

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
    redirect('/dashboard/wishlists');
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    return {
      success: false,
      message: 'Serverfout.',
      errors: { _form: [error instanceof Error ? error.message : 'Onbekende fout'] },
    };
  }
}