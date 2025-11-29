export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string; // ISO string
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
  wishlist?: any; // kan later gespecificeerd worden
}

export interface Event {
  id: string;
  name: string;
  profileId: string | null;
  date: string; // ISO string
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
  lastReadTimestamps: Record<string, number>; // timestamp in ms
  drawnNames: Record<string, string>;
  tasks: Task[];
  backgroundImage: string;
  createdAt: string; // ISO string
  isInvited?: boolean;
  updatedAt: string; // ISO string
  allowDrawingNames?: boolean;
  purchases?: any; // kan later gespecificeerd worden
}
