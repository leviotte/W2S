export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string;
  isAnonymous?: boolean;
  gifUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedParticipants: string[];
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  confirmed: boolean;
  wishlistId?: string;
  wishlist: any;
}

export interface Event {
  id: string;
  name: string;
  profileId: string;
  date: string;
  time?: string;
  endTime?: string;
  budget: number;
  location?: string;
  theme?: string;
  additionalInfo?: string;
  organizerPhone?: string;
  organizerEmail?: string;
  organizer: string;
  isLootjesEvent: boolean;
  registrationDeadline?: string;
  maxParticipants?: number;
  currentParticipantCount?: number;
  allowSelfRegistration: boolean;
  participants: Record<string, Participant>;
  messages: Message[];
  lastReadTimestamps: Record<string, number>;
  drawnNames: Record<string, string>;
  tasks: Task[];
  backgroundImage: string;
  createdAt: string; // Firebase Timestamp -> string
  isInvited: boolean;
  updatedAt: string; // Firebase Timestamp -> string
  allowDrawingNames: boolean;
  purchases: any;
}
