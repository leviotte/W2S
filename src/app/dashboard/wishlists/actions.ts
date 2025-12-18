// src/app/dashboard/wishlists/create/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { wishlistItemSchema } from '@/types/wishlist';

// ✅ VERSIMPELD SCHEMA - minder strict
const CreateWishlistFormSchema = z.object({
  wishlistName: z.string()
    .min(1, 'De naam mag niet leeg zijn.')
    .max(100, 'De naam mag maximaal 100 tekens zijn.'),
  backgroundImage: z.string()
    .optional()
    .nullable()
    .transform(val => val || ''),
  items: z.string()
    .min(1, 'Items data is verplicht')
    .transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        
        if (!Array.isArray(parsed)) {
          ctx.addIssue({ 
            code: 'custom', 
            message: 'Items moet een array zijn.' 
          });
          return z.NEVER;
        }
        
        if (parsed.length === 0) {
          ctx.addIssue({ 
            code: 'custom', 
            message: 'Voeg minstens één item toe aan je wishlist.' 
          });
          return z.NEVER;
        }
        
        const validated = z.array(wishlistItemSchema).parse(parsed);
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
  eventId: z.string().optional().nullable(),
  participantId: z.string().optional().nullable(),
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

export async function createWishlistFormAction(
  prevState: CreateWishlistFormState,
  formData: FormData
): Promise<CreateWishlistFormState> {
  console.log('=== CREATE WISHLIST FORM ACTION ===');
  
  const session = await getSession();
  if (!session.user) {
    return { 
      success: false, 
      message: 'Niet geautoriseerd.',
      errors: { _form: ['Je moet ingelogd zijn.'] }
    };
  }

  // ✅ PARSE RAW DATA
  const rawData = {
    wishlistName: formData.get('wishlistName'),
    backgroundImage: formData.get('backgroundImage'),
    items: formData.get('items'),
    eventId: formData.get('eventId'),
    participantId: formData.get('participantId'),
  };

  console.log('📥 Raw FormData:', {
    wishlistName: rawData.wishlistName,
    backgroundImage: rawData.backgroundImage,
    itemsLength: rawData.items ? String(rawData.items).length : 0,
    eventId: rawData.eventId,
    participantId: rawData.participantId,
  });

  // ✅ VALIDEER
  const validatedFields = CreateWishlistFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten();
    console.error('❌ Validation failed:', errors);
    
    return {
      success: false,
      message: 'Validatie mislukt. Controleer de velden.',
      errors: errors.fieldErrors,
    };
  }

  const { wishlistName, backgroundImage, items, eventId, participantId } = validatedFields.data;

  console.log('✅ Validated data:', { 
    wishlistName, 
    backgroundImageLength: backgroundImage?.length || 0,
    itemCount: items.length,
    eventId,
    participantId 
  });

  try {
    const defaultBackground = 'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media';

    const wishlistData = {
      name: wishlistName,
      items: items,
      isPublic: false,
      ownerId: session.user.id,
      ownerName: session.user.displayName || `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim(),
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

    console.log('💾 Creating wishlist in Firebase...');

    const newWishlistRef = await adminDb.collection('wishlists').add(wishlistData);
    const newWishlistId = newWishlistRef.id;

    console.log('✅ Wishlist created with ID:', newWishlistId);

    // Event update logic (if applicable)
    if (eventId && participantId) {
      console.log('🔄 Updating event:', eventId);
      
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
          
          console.log('✅ Event updated');
          
          revalidatePath(`/dashboard/event/${eventId}`);
          revalidatePath('/dashboard/wishlists');
          
          redirect(`/dashboard/event/${eventId}`);
        }
      }
    }

    console.log('🔄 Redirecting to /dashboard/wishlists');
    revalidatePath('/dashboard/wishlists');
    redirect('/dashboard/wishlists');

  } catch (error) {
    // ✅ Next.js redirect throws an error (dit is normaal!)
    if (error && typeof error === 'object' && 'digest' in error) {
      console.log('🔄 Redirect error (normal):', (error as any).digest);
      throw error; // Laat redirect door
    }

    console.error('❌ Server error:', error);
    return {
      success: false,
      message: 'Er is een serverfout opgetreden.',
      errors: { 
        _form: [error instanceof Error ? error.message : 'Onbekende fout'] 
      },
    };
  }
}