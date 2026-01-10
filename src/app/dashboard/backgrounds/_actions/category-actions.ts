// src/app/dashboard/backgrounds/_actions/category-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/server/firebase-admin';
import { backgroundCategorySchema } from "@/modules/dashboard/backgrounds.types";

// Schema voor het toevoegen, ongewijzigd
const addCategorySchema = backgroundCategorySchema.omit({ id: true });

// Functie voor toevoegen, met gecorrigeerd 'catch' blok
export async function addCategoryAction(prevState: any, formData: FormData) {
  try {
    const data = Object.fromEntries(formData);
    const parsedData = addCategorySchema.parse(data);

    // TODO: Voeg hier een check toe om te zien of de gebruiker een admin is.
    await adminDb.collection('backgroundCategories').add(parsedData);

    revalidatePath('/dashboard/backgrounds');
    return { success: true, message: `Categorie '${parsedData.name}' toegevoegd.` };
  } catch (error) {
    // DE FIX: Gebruik 'error.issues' in plaats van 'error.errors'.
    // Dit lost beide TypeScript-fouten in één keer op.
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: error.issues.map(issue => issue.message).join(', ') 
      };
    }
    console.error('Error adding category:', error);
    return { success: false, message: 'Er is een onverwachte fout opgetreden.' };
  }
}

// Delete action blijft ongewijzigd
export async function deleteCategoryAction(id: string) {
  if (!id) {
    return { success: false, message: 'Geen ID opgegeven.' };
  }
  try {
    // TODO: Voeg ook hier een admin-check toe.
    await adminDb.collection('backgroundCategories').doc(id).delete();
    revalidatePath('/dashboard/backgrounds');
    return { success: true, message: 'Categorie verwijderd.' };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, message: 'Er is een fout opgetreden bij het verwijderen.' };
  }
}