'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/server/firebase-admin';
import { UserProfile } from '@/types/user';

// Schema voor de zoekparameters
const SearchQuerySchema = z.object({
  query: z.string().trim().min(1, 'Een zoekterm is verplicht.'),
});

// Helper om leeftijd te berekenen, veilig op de server
const calculateAge = (birthdate?: string | null): number | undefined => {
  if (!birthdate) return undefined;
  const birthYear = new Date(birthdate).getFullYear();
  if (isNaN(birthYear)) return undefined;
  const age = new Date().getFullYear() - birthYear;
  return age;
};

// CORRECTIE 1: Het SearchResult type expliciet gedefinieerd zonder 'Pick'
// Dit lost de fout op omdat we nu correct omgaan met geneste properties.
export type SearchResult = {
  id: string;
  displayName: string;
  username?: string | null;
  photoURL?: string | null;
  city?: string | null;
  gender?: string | null;
  age?: number;
};

export async function performSearchAction(params: { query: string }): Promise<{ success: true, data: SearchResult[] } | { success: false, error: string }> {
  const validation = SearchQuerySchema.safeParse(params);

  // CORRECTIE 2: Zod error handling via de 'issues' array
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || 'Ongeldige zoekopdracht.';
    return { success: false, error: errorMessage };
  }
  
  const { query: searchTerm } = validation.data;
  const lowerCaseQuery = searchTerm.toLowerCase();

  try {
    const nameQuery = adminDb.collection('users')
      .where('isPublic', '==', true)
      .where('displayName_lowercase', '>=', lowerCaseQuery)
      .where('displayName_lowercase', '<=', lowerCaseQuery + '\uf8ff')
      .limit(20);

    const querySnapshot = await nameQuery.get();
    
    if (querySnapshot.empty) {
      return { success: true, data: [] };
    }

    const results: SearchResult[] = querySnapshot.docs.map(doc => {
      const data = doc.data() as UserProfile;
      return {
        id: doc.id,
        displayName: data.displayName,
        username: data.username,
        photoURL: data.photoURL,
        // We halen 'city' nu veilig uit het 'address' object
        city: data.address?.city, 
        gender: data.gender,
        age: calculateAge(data.birthdate),
      };
    });

    return { success: true, data: results };

  } catch (err) {
    console.error("Fout bij uitvoeren van zoekopdracht:", err);
    return { success: false, error: "Er ging iets mis op de server bij het zoeken." };
  }
}