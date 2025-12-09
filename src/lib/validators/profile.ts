// src/lib/validators/profile.ts
import { z } from 'zod';
import { addressSchema } from '@/types/address';

/**
 * Validatieschema voor het 'Persoonlijke Info' formulier.
 */
export const profileInfoSchema = z.object({
  firstName: z.string().min(2, 'Voornaam is te kort.').optional(),
  lastName: z.string().min(2, 'Achternaam is te kort.').optional(),
  username: z.string().min(3, "Gebruikersnaam is te kort.").optional(),
  // Email wordt meestal niet hier gewijzigd, maar apart. We laten het hier voor nu.
  email: z.string().email('Ongeldig e-mailadres.'), 
  phone: z.string().optional(),
  birthdate: z.string().optional(),
});

/**
 * Validatieschema voor het 'Adres' formulier.
 * We gebruiken .extend() om de velden van het geïmporteerde schema te gebruiken
 * en ze te nesten onder een 'address' property, precies zoals ons formulier verwacht.
 */
export const profileAddressSchema = z.object({
  address: addressSchema,
});

/**
 * Validatieschema voor het uploaden/wijzigen van een profielfoto.
 */
export const profilePhotoSchema = z.object({
  photoURL: z.string().url('Ongeldige URL').or(z.literal('')).nullable(),
});

/**
 * Validatieschema voor het aanpassen van de openbare status van een profiel.
 */
export const profilePublicStatusSchema = z.object({
  isPublic: z.boolean(),
});

// We kunnen alle profiel-gerelateerde formuliervalidaties hier centraliseren.