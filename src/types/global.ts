// src/types/global.ts
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  birthdate: string;
  phone?: string;
  photoURL?: string | null;
  avatarURL?: string | null;
  name?: string;
  isAdmin?: boolean;
  isPublic?: boolean;
  profileId?: string;
  gender: string;
  address?: {
    street: string;
    number: string;
    box?: string;
    postalCode: string;
    city: string;
  };
  notifications: {
    email: boolean;
  };
  emailVerified: boolean;
}

export interface Event {
  id: string;
  name: string;
  profileId: string | null;
  date: string;
  time?: string | null;
  budget: number;
  organizer: string;
  isLootjesEvent: boolean;
  registrationDeadline?: string | null;
  maxParticipants: number;
  participants: Record<
    string,
    {
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      confirmed?: boolean;
      wishlistId?: string | null;
    }
  >;
  backgroundImage?: string;
  messages: any[];
  lastReadTimestamps: Record<string, string>;
  drawnNames: Record<string, string>;
  tasks: any[];
  allowSelfRegistration: boolean;
  currentParticipantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  name: string;
  userId: string;
  profileId?: string | null;
  owner: string;
  items: any[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreState {
  currentUser: UserProfile | null;
  events: Event[];
  wishlists: Wishlist[];
  unsubscribeListeners: (() => void)[];
  loading: boolean;
  error: string | null;

  loadWishlists: () => Promise<void>;
  loadEvents: () => Promise<void>;
}
