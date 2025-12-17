// src/app/search/actions.ts

'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile, SubProfile, SearchResult } from '@/types/user';

const SearchQuerySchema = z.object({
  query: z.string().trim().min(1, 'Een zoekterm is verplicht.'),
});

function serializeData(data: any): any {
  if (!data) return null;
  const serialized: { [key: string]: any } = {};
  for (const key in data) {
    if (data[key] && typeof data[key].toDate === 'function') {
      serialized[key] = data[key].toDate().toISOString();
    } else if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      serialized[key] = serializeData(data[key]);
    } else {
      serialized[key] = data[key];
    }
  }
  return serialized;
}

const calculateAge = (birthdate?: string | null): number | undefined => {
  if (!birthdate) return undefined;
  const birthDate = (birthdate as any).toDate ? (birthdate as any).toDate() : new Date(birthdate);
  if (isNaN(birthDate.getTime())) return undefined;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export async function performSearchAction(params: { query: string }): Promise<{ success: true, data: SearchResult[] } | { success: false, error: string }> {
  const validation = SearchQuerySchema.safeParse(params);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Ongeldige zoekopdracht.' };
  }
  
  const { query: searchTerm } = validation.data;
  const lowerCaseQuery = searchTerm.toLowerCase();

  try {
    const usersQuery = adminDb.collection('users')
      .where('isPublic', '==', true)
      .orderBy('firstName_lower')
      .startAt(lowerCaseQuery)
      .endAt(lowerCaseQuery + '\uf8ff')
      .limit(15);
      
    const profilesQuery = adminDb.collection('profiles')
      .where('isPublic', '==', true)
      .orderBy('firstName_lower')
      .startAt(lowerCaseQuery)
      .endAt(lowerCaseQuery + '\uf8ff')
      .limit(15);

    const [userSnapshots, profileSnapshots] = await Promise.all([
      usersQuery.get(),
      profilesQuery.get(),
    ]);
    
    const results: SearchResult[] = [];
    const foundUserIds = new Set<string>();

    // ✅ Verwerk 'users' resultaten met firstName & lastName
    userSnapshots.forEach(doc => {
      if (!foundUserIds.has(doc.id)) {
        const data = serializeData(doc.data()) as UserProfile;
        results.push({
          id: doc.id,
          displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          firstName: data.firstName,      // ✅ ADDED
          lastName: data.lastName,        // ✅ ADDED
          username: data.username,
          photoURL: data.photoURL,
          city: data.address?.city, 
          gender: data.gender,
          age: calculateAge(data.birthdate),
          type: 'user'
        });
        foundUserIds.add(doc.id);
      }
    });

    // ✅ Verwerk 'profiles' (SubProfile) resultaten met firstName & lastName
    profileSnapshots.forEach(doc => {
      const data = serializeData(doc.data()) as SubProfile;
      const ownerId = data.userId || data.parentId;

      if (ownerId && !foundUserIds.has(ownerId)) {
        results.push({
          id: doc.id,
          displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          firstName: data.firstName,      // ✅ ADDED
          lastName: data.lastName,        // ✅ ADDED
          username: undefined,
          photoURL: data.photoURL,
          city: undefined,
          gender: data.gender,
          age: calculateAge(data.birthdate),
          type: 'profile'
        });
        foundUserIds.add(ownerId);
      }
    });

    return { success: true, data: results };

  } catch (err) {
    console.error("Fout bij uitvoeren van zoekopdracht:", err);
    return { success: false, error: "Er ging iets mis op de server bij het zoeken." };
  }
}