// src/lib/actions/blog-actions.ts
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Het pad naar je adminDb-instantie, overgenomen uit jouw code.
import { adminDb } from '../server/firebase-admin';
import { wishlistItemSchema } from '@/types/product';
// We gaan er voor nu van uit dat er een server-side getSession functie is
// import { getSession } from '@/lib/server/auth'; 

// --- Zod Schema's ---
const postSectionSchema = z.object({
  id: z.string(),
  subTitle: z.string(),
  content: z.string(),
  items: z.array(wishlistItemSchema),
});

const createPostSchema = z.object({
  headTitle: z.string().min(1, "Titel is verplicht."),
  headDescription: z.string(),
  headImage: z.string().url("Een geldige afbeeldings-URL is vereist."),
  subDescription: z.string(),
  sections: z.array(postSectionSchema),
});


// --- Server Actions ---

/**
 * Maakt een nieuwe blogpost aan in Firestore.
 */
export async function createPostAction(data: unknown) {
  // Voorbeeld van admin-check
  // const session = await getSession();
  // if (!session?.user?.isAdmin) return { success: false, error: 'Authenticatie vereist.' };

  const validationResult = createPostSchema.safeParse(data);
  if (!validationResult.success) {
      console.error('Validatiefout:', validationResult.error.flatten().fieldErrors);
      return { success: false, error: 'De aangeleverde data is ongeldig.' };
  }
  
  try {
    const postsCollectionRef = adminDb.collection('posts');
    
    await postsCollectionRef.add({
      ...validationResult.data,
      authorId: "dummy_user_id", // Later vervangen door session.user.profile.id
      authorName: "Levi Otte",   // Later vervangen door session.user.profile.name
      createdAt: FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error("Firestore Fout bij aanmaken:", error);
    return { success: false, error: "Post kon niet worden opgeslagen in de database." };
  }

  // Vernieuw de cache voor de blog-overzichtspagina
  revalidatePath('/blog');
  
  return { success: true };
}


/**
 * Verwijdert een blogpost uit Firestore.
 */
export async function deletePostAction(postId: string) {
  if (!postId) {
    return { success: false, error: "Post ID ontbreekt." };
  }
  
  // Voorbeeld van admin-check
  // const session = await getSession();
  // if (!session?.user?.isAdmin) {
  //   return { success: false, error: "Geen toestemming." };
  // }

  try {
    await adminDb.collection('posts').doc(postId).delete();
  } catch (error) {
    console.error("Firestore Fout bij verwijderen:", error);
    return { success: false, error: "Post kon niet worden verwijderd." };
  }

  // Vernieuw de cache voor de blog-overzichtspagina zodat de post verdwijnt
  revalidatePath('/blog');
  
  return { success: true };
}