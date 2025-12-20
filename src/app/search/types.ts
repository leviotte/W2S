import { z } from 'zod';

// Zod schemas voor type-safety
export const searchFormSchema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht'),
  lastName: z.string().optional(),
});

export const filterSchema = z.object({
  city: z.string().optional(),
  minAge: z.coerce.number().min(0).max(120).optional(),
  maxAge: z.coerce.number().min(0).max(120).optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
});

// Types
export type SearchFormData = z.infer<typeof searchFormSchema>;
export type FilterData = z.infer<typeof filterSchema>;

export interface SearchResult {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  email?: string;
  type: 'account' | 'profile';
  address?: {
    city?: string;
    country?: string;
  };
  city?: string;
  photoURL?: string;
  birthdate?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  username?: string;
}

export interface SearchState {
  allResults: SearchResult[];
  filteredResults: SearchResult[];
  availableCities: string[];
  ageRange: [number, number];
  isSearching: boolean;
  hasSearched: boolean;
  error: string | null;
}