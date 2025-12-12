// src/types/blog.ts
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { nl as nlBE } from 'date-fns/locale';

// ============================================================================
// BLOG SECTION TYPES
// ============================================================================

/**
 * Individual item binnen een blog section (affiliate product, voorbeeld, etc.)
 */
export type BlogSectionItem = {
  id: string;
  title: string;
  image?: string;
  description: string;
  url?: string;
  price?: string;
  source?: string; // TOEGEVOEGD: 'Amazon', 'Bol.com', etc.
  ean?: string; // TOEGEVOEGD: Voor product matching
};

/**
 * Een section binnen een blog post
 */
export type BlogSection = {
  subTitle?: string;
  subDescription?: string; // TOEGEVOEGD: Voor meer flexibiliteit
  subImage?: string; // TOEGEVOEGD: Voor section images
  subImagePosition?: 'before' | 'after'; // TOEGEVOEGD: Image positie
  content?: string; // BEHOUDEN: Vrije tekst content
  items?: BlogSectionItem[]; // BEHOUDEN: Je bestaande items (affiliate products)
  
  // LEGACY SUPPORT: Als je oude data heeft met 'affiliateProduct'
  affiliateProduct?: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    url: string;
    source: string;
  };
};

// ============================================================================
// BLOG POST TYPES
// ============================================================================

/**
 * Volledige Blog Post zoals opgeslagen in Firestore
 * - Gebruikt Timestamp voor datum velden (Firestore native)
 * - Ondersteunt zowel authorId (string) als author object
 */
export type BlogPost = {
  id: string;
  headTitle: string;
  headDescription: string;
  headImage: string;
  subDescription?: string;
  sections?: BlogSection[];
  content?: string; // BEHOUDEN: Voor backwards compatibility
  
  // AUTHOR INFO (flexibel: string OF object)
  authorId?: string; // Voor Firestore queries
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  authorName?: string; // Denormalized voor performance
  
  // TIMESTAMPS (Firestore-compatible)
  createdAt: Timestamp | { _seconds: number; _nanoseconds: number } | Date;
  updatedAt?: Timestamp | { _seconds: number; _nanoseconds: number } | Date;
  
  // METADATA
  published?: boolean;
  slug?: string; // TOEGEVOEGD: Voor SEO-friendly URLs
  tags?: string[];
  views?: number; // BEHOUDEN: Je bestaande views tracking
  metaDescription?: string; // TOEGEVOEGD: Voor SEO
};

/**
 * Vereenvoudigde Post Summary voor Blog Grid weergave
 * - Alleen de essentiële velden voor performance
 */
export type PostSummary = {
  id: string;
  headTitle: string;
  headDescription: string;
  headImage: string;
  createdAt: { _seconds: number; _nanoseconds: number } | Timestamp | Date;
  authorName?: string;
  tags?: string[];
  views?: number; // BEHOUDEN: Voor "populair" sorting
  published?: boolean;
};

/**
 * Client-friendly Post met Date objects (na Firestore conversie)
 * - Voor gebruik in Client Components waar je echte Date objects wilt
 */
export type ClientBlogPost = Omit<BlogPost, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt?: Date;
};

// ============================================================================
// FORM/ACTION TYPES
// ============================================================================

/**
 * Input data voor het aanmaken van een nieuwe post
 */
export type CreatePostInput = {
  headTitle: string;
  headDescription: string;
  headImage: string;
  subDescription?: string;
  sections?: BlogSection[];
  content?: string;
  tags?: string[];
  published?: boolean;
  slug?: string;
  metaDescription?: string;
};

/**
 * Input data voor het updaten van een post
 */
export type UpdatePostInput = Partial<CreatePostInput> & {
  id: string;
};

// ============================================================================
// LEGACY TYPE ALIASES (voor backwards compatibility)
// ============================================================================

/**
 * @deprecated Gebruik CreatePostInput
 */
export type createPostAction = CreatePostInput;

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

/**
 * Check of een value een Firestore Timestamp is
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return value !== null && 
         typeof value === 'object' && 
         'toDate' in value;
}

/**
 * Check of een value een Timestamp-like object is
 */
export function isTimestampLike(value: unknown): value is { _seconds: number; _nanoseconds: number } {
  return value !== null && 
         typeof value === 'object' && 
         '_seconds' in value && 
         '_nanoseconds' in value;
}

/**
 * Converteer Timestamp/TimestampLike naar Date
 */
export function toDate(timestamp: Timestamp | { _seconds: number; _nanoseconds: number } | Date): Date {
  if (timestamp instanceof Date) return timestamp;
  if (isTimestamp(timestamp)) return timestamp.toDate();
  if (isTimestampLike(timestamp)) return new Date(timestamp._seconds * 1000);
  return new Date(); // Fallback
}