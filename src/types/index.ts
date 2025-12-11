// src/types/index.ts
// ============================================================================
// BARREL EXPORT - Correcte import volgorde (dependencies eerst)
// ============================================================================

// Address (independent)
export * from './address';

// User (depends on address)
export * from './user';

// Chat & Task (independent)
export * from './chat';
export * from './task';

// Product (independent - MOET VOOR WISHLIST)
export * from './product';

// Wishlist (depends on product) ✅
export * from './wishlist';

// Event (depends on chat & task)
export * from './event';

// Other types
export * from './blog';
export * from './social-media';
export * from './affiliate';
export * from './amazon';
export * from './background';
export * from './filters';
export * from './inquiry';
export * from './requests';