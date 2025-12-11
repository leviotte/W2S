export type InquiryType = 
  | 'general'
  | 'technical'
  | 'billing'
  | 'feature'
  | 'bug'
  | 'other';

export type InquiryStatus = 'pending' | 'resolved';

export type Inquiry = {
  id: string;
  uid: string;
  email: string;
  message: string;
  inquiryType: InquiryType;
  isResolved: boolean;
  createdAt: Date;
  updatedAt?: Date;
};

export type InquiryWithUser = Inquiry & {
  user: {
    id: string;
    email: string;
    photoURL?: string;
    name: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

export type InquiryStats = {
  total: number;
  resolved: number;
  pending: number;
};

export type InquiryFilters = {
  search?: string;
  status?: 'all' | InquiryStatus;
  type?: 'all' | InquiryType;
};