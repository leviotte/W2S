// src/types/index.ts
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

/**
 * Een robuuste, herbruikbare schema voor Firestore Timestamps.
 * Dit converteert een Firestore Timestamp object naar een standaard JS Date object.
 */
export const TimestampSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    return arg.toDate();
  }
  if (typeof arg === 'string' || typeof arg === 'number') {
    const date = new Date(arg);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return arg;
}, z.date({ message: "Ongeldig datumformaat" }));

/**
 * Een apart, herbruikbaar schema voor een adres.
 */
export const AddressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(), // Toegevoegd voor volledigheid
  box: z.string().optional(),    // Toegevoegd voor volledigheid
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});
export type Address = z.infer<typeof AddressSchema>;

// Dit is een goede plek voor andere globale types, zoals API responses
export type ActionResponse<T = null> = {
  success: boolean;
  message: string;
  data?: T;
};