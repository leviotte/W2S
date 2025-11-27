export type User = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string | null;
  isAdmin: boolean;
};

export type Profile = {
  id: string; // Document ID in Firestore
  name: string;
  avatarURL?: string | null;
  ownerId: string;
};