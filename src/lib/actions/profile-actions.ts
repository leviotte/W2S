// src/lib/actions/profile-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '../auth/actions';

// Definieer het schema voor een nieuw subprofiel met Zod voor validatie
const subProfileSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  birthdate: z.string().min(1, "Geboortedatum is verplicht"),
  gender: z.string().optional(),
  address: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  photoURL: z.string().url().optional(),
});

export async function createSubProfileAction(data: unknown) {
  // 1. Authenticatie en Autorisatie
  const session = await getSession();
  if (!session?.user?.profile.id) {
    return { success: false, error: 'Authenticatie vereist.' };
  }

  // 2. Validatie van de input
  const validationResult = subProfileSchema.safeParse(data);
  if (!validationResult.success) {
    return { success: false, error: 'Ongeldige data.', details: validationResult.error.flatten() };
  }
  
  const profileData = validationResult.data;

  try {
    // 3. Database operatie
    const userRef = adminDb.collection('users').doc(session.user.profile.id);
    
    // Voeg het profiel toe aan de 'subprofiles' subcollectie
    const newSubProfileRef = await userRef.collection('subprofiles').add({
      ...profileData,
      isPublic: false, // Standaardwaarde
      createdAt: new Date(),
    });

    const newSubProfile = {
      id: newSubProfileRef.id,
      ...profileData,
    };

    // 4. Revalidatie van de cache
    // Dit zorgt ervoor dat de pagina's die profielen tonen, worden bijgewerkt
    revalidatePath('/dashboard/info');
    revalidatePath('/dashboard/profile');

    // 5. Succesvolle response terugsturen met de nieuwe data
    return { success: true, data: newSubProfile };

  } catch (error) {
    console.error("Fout bij aanmaken subprofiel:", error);
    return { success: false, error: 'Kon het profiel niet aanmaken in de database.' };
  }
}