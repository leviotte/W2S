// src/types/address.ts
import { z } from 'zod';

/**
 * AddressSchema definieert de structuur en validatie voor een adres.
 * Dit is een herbruikbaar schema dat zowel voor gebruikersprofielen als
 * voor bijvoorbeeld evenementlocaties kan worden gebruikt.
 */
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
}).nullable(); // We staan toe dat het hele adres-object null is.

export type Address = z.infer<typeof addressSchema>;