export interface Inquiry {
  id: string;
  uid: string;
  createdAt: string;
  email: string;
  message: string;
  inquiryType: string;
  isResolved: boolean;
}

export interface User {
  email: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
}

export interface InquiryWithUser extends Inquiry {
  user: User | null;
}

export interface InquiryStats {
  total: number;
  resolved: number;
  pending: number;
}

export interface InquiryFilters {
  status?: 'all' | 'resolved' | 'pending';
  type?: string | 'all';
  search?: string;
}
