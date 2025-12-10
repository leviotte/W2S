'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { adminDb } from '../server/firebase-admin';
// BELANGRIJKE WIJZIGING: We gebruiken het basis productSchema, want in een blog zijn het 'producten'.
import { productSchema } from '@/types/product'; 

// --- Zod Schema's ---

const postSectionSchema = z.object({
  id: z.string(),
  subTitle: z.string(),
  content: z.string(),
  // Gebruik nu het correcte, meer generieke productSchema.
  items: z.array(productSchema), 
});

const createPostSchema = z.object({
  headTitle: z.string().min(1, "Titel is verplicht."),
  headDescription: z.string().optional(),
  headImage: z.string().url("Een geldige afbeeldings-URL is vereist."),
  subDescription: z.string().optional(),
  sections: z.array(postSectionSchema),
});

// NIEUW: Schema voor het updaten, breidt de create-schema uit met de post ID.
const updatePostSchema = createPostSchema.extend({
    id: z.string().min(1, "Post ID is verplicht."),
});


// --- Server Actions ---

/**
 * Maakt een nieuwe blogpost aan in Firestore.
 */
export async function createPostAction(data: unknown) {
  // const session = await getSession();
  // if (!session?.user?.isAdmin) return { success: false, error: 'Authenticatie vereist.' };

  const validationResult = createPostSchema.safeParse(data);
  if (!validationResult.success) {
      console.error('Validatiefout bij aanmaken:', validationResult.error.flatten().fieldErrors);
      return { success: false, error: 'De aangeleverde data is ongeldig.' };
  }
  
  try {
    const postsCollectionRef = adminDb.collection('posts');
    
    await postsCollectionRef.add({
      ...validationResult.data,
      // authorId: session.user.profileId,
      // authorName: session.user.profileName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error("Firestore Fout bij aanmaken:", error);
    return { success: false, error: "Post kon niet worden opgeslagen in de database." };
  }

  revalidatePath('/blog');
  
  return { success: true };
}

/**
 * NIEUW: Werkt een bestaande blogpost bij in Firestore.
 */
export async function updatePostAction(data: unknown) {
    // const session = await getSession();
    // if (!session?.user?.isAdmin) return { success: false, error: 'Authenticatie vereist.' };

    const validationResult = updatePostSchema.safeParse(data);

    if (!validationResult.success) {
        console.error('Validatiefout bij updaten:', validationResult.error.flatten().fieldErrors);
        return { success: false, error: 'De aangeleverde data voor de update is ongeldig.' };
    }

    const { id, ...postData } = validationResult.data;

    try {
        const postRef = adminDb.collection('posts').doc(id);
        
        await postRef.update({
            ...postData,
            updatedAt: FieldValue.serverTimestamp(),
        });

    } catch (error) {
        console.error(`Firestore Fout bij bijwerken van post ${id}:`, error);
        return { success: false, error: "Post kon niet worden bijgewerkt in de database." };
    }

    // Revalideer zowel de bloglijst als de specifieke postpagina.
    revalidatePath('/blog');
    revalidatePath(`/blog/${id}`); // Essentieel voor de detailpagina!
    
    return { success: true };
}


/**
 * Verwijdert een blogpost uit Firestore.
 */
export async function deletePostAction(postId: string) {
  if (!postId) {
    return { success: false, error: "Post ID ontbreekt." };
  }
  
  // const session = await getSession();
  // if (!session?.user?.isAdmin) return { success: false, error: "Geen toestemming." };

  try {
    await adminDb.collection('posts').doc(postId).delete();
  } catch (error) {
    console.error("Firestore Fout bij verwijderen:", error);
    return { success: false, error: "Post kon niet worden verwijderd." };
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${postId}`);
  
  return { success: true };
}