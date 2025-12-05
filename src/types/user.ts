/**
 * types/user.ts
 * 
 * Single Source of Truth voor alle gebruikersgerelateerde datastructuren en validatieschema's.
 * We gebruiken Zod om zowel de datavorm te valideren als de TypeScript types automatisch af te leiden.
 */

import { z } from 'zod';

// ============================================================================
// Deel-schema voor een adres. Herbruikbaar in andere schema's.
// ============================================================================
export const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  box: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});
export type Address = z.infer<typeof addressSchema>;


// ============================================================================
// Het KERN UserProfile Schema & Type
// Dit definieert de data die we in componenten zoals UserAvatar, SiteHeader, etc. gebruiken.
// ============================================================================
export const userProfileSchema = z.object({
  id: z.string(), // De Firebase UID
  email: z.string().email(),
  
  // DE WIJZIGING: 'slug' is hernoemd naar 'username' voor duidelijkheid en consistentie.
  username: z.string().min(3, 'Gebruikersnaam moet minstens 3 tekens lang zijn').optional(),

  firstName: z.string().min(1, 'Voornaam is verplicht').optional(),
  lastName: z.string().min(1, 'Achternaam is verplicht').optional(),
  photoURL: z.string().url("Ongeldige URL voor profielfoto").nullable().optional(),
  
  // Optionele, meer gedetailleerde profielvelden
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  isPublic: z.boolean().default(true),
});

// **DIT IS DE CRUCIALE EXPORT** voor onze componenten.
// Dit wordt het standaard 'user' object dat we door de client-side app doorgeven.
export type UserProfile = z.infer<typeof userProfileSchema>;


// ============================================================================
// Het Volledige UserData Schema (voor Firestore)
// Dit breidt het profiel uit met server-side/private data.
// ============================================================================
export const userSchema = userProfileSchema.extend({
  // Om compatibel te zijn met oudere code, houden we uid & id als synoniemen
  uid: z.string(),
  emailVerified: z.boolean(),
  isAdmin: z.boolean().default(false),
  // Tip: gebruik z.date() of z.any() afhankelijk van hoe je Timestamps behandelt
  createdAt: z.any().optional(), 
  updatedAt: z.any().optional(),
});

// Dit type vertegenwoordigt het volledige document zoals het in de 'users' collectie in Firestore staat.
export type UserData = z.infer<typeof userSchema>;