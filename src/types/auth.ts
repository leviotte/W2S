// src/types/auth.ts
import { User } from 'firebase/auth';
import type { UserProfile, SubProfile } from './user';

/**
 * Dit is het 'gehydrateerde' user object dat we server-side creëren.
 * Het combineert de Firebase Auth informatie met ons eigen profiel uit de database.
 * Dit is het object dat we doorgeven aan de client-side via de AuthProvider.
 */
export type AuthedUser = {
  // Van Firebase Auth
  uid: string;
  email: string | null;
  emailVerified: boolean;
  
  // Van onze Firestore database
  profile: UserProfile | SubProfile;

  // Handige booleans
  isLoggedIn: true;
  isAdmin: boolean;
};

// Een type voor als de gebruiker niet is ingelogd
export type UnauthedUser = {
  isLoggedIn: false;
  uid: null;
  email: null;
  emailVerified: false,
  profile: null;
  isAdmin: false;
};

// Een type guard om eenvoudig te checken of we een volledige user hebben
export function isAuthenticatedUser(user: any): user is AuthedUser {
  return user?.isLoggedIn === true && !!user.profile;
}