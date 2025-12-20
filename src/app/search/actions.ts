// src/app/search/actions.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import type { SearchResult } from './types';

// ✅ Hergebruik jouw bestaande serializeData
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

// ✅ Hergebruik jouw bestaande calculateAge
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

// ✅ NIEUWE functie: split firstName/lastName search
export async function searchUsersAction(firstName: string, lastName?: string) {
  try {
    if (!firstName.trim()) {
      return {
        success: false,
        error: 'Zonder voornaam kunnen we niet zoeken.',
        data: null,
      };
    }

    const results: SearchResult[] = [];
    const lowerCaseFirstName = firstName.toLowerCase();

    // Search users (public only)
    const usersRef = adminDb.collection('users');
    const userQuery = usersRef
      .where('isPublic', '==', true)
      .orderBy('firstName_lower')
      .startAt(lowerCaseFirstName)
      .endAt(lowerCaseFirstName + '\uf8ff')
      .limit(50);

    const userSnapshots = await userQuery.get();

    userSnapshots.forEach((doc) => {
      const userData = serializeData(doc.data());
      
      // Match lastName if provided
      const matchesLastName =
        !lastName ||
        userData.lastName?.toLowerCase().startsWith(lastName.toLowerCase());

      if (matchesLastName) {
        const age = calculateAge(userData.birthdate);
        results.push({
          id: doc.id,
          displayName: `${userData.firstName} ${userData.lastName || ''}`.trim(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          photoURL: userData.photoURL,
          address: {
            city: userData.address?.city,
            country: userData.address?.country,
          },
          city: userData.address?.city,
          birthdate: userData.birthdate,
          age,
          gender: userData.gender,
          type: 'account',
          username: userData.username,
        });
      }
    });

    // Search profiles (public only)
    const profilesRef = adminDb.collection('profiles');
    const profileQuery = profilesRef
      .where('isPublic', '==', true)
      .orderBy('name_lower')
      .startAt(lowerCaseFirstName)
      .endAt(lowerCaseFirstName + '\uf8ff')
      .limit(50);

    const profileSnapshots = await profileQuery.get();

    profileSnapshots.forEach((doc) => {
      const profileData = serializeData(doc.data());
      
      const matchesName =
        !lastName ||
        profileData.name.toLowerCase().includes(lastName.toLowerCase());

      if (matchesName) {
        const age = calculateAge(profileData.birthdate);
        results.push({
          id: doc.id,
          displayName: profileData.name,
          photoURL: profileData.avatarURL,
          address: {
            city: profileData.address?.city,
            country: profileData.address?.country,
          },
          city: profileData.address?.city,
          birthdate: profileData.birthdate,
          age,
          gender: profileData.gender,
          type: 'profile',
        });
      }
    });

    return {
      success: true,
      data: results,
      error: null,
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: 'Er ging iets mis bij het zoeken',
      data: null,
    };
  }
}