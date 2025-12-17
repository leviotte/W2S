export type SubProfile = {
  id: string;
  userId: string;

  firstName: string;
  lastName: string;
  displayName: string;
  displayName_lowercase: string;

  photoURL?: string | null;
  birthdate?: string | null;
  gender?: string | null;

  isPublic: boolean;

  createdAt: Date;
  updatedAt: Date;
};
