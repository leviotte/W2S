// src/types/address.ts
import { z } from 'zod';

/**
 * ✅ SINGLE SOURCE OF TRUTH voor Address
 * Gebruikt in UserProfile en mogelijk EventLocations
 */

/**
 * Address Schema - NULLABLE versie (voor opslag in DB)
 * Alle velden zijn optioneel en nullable
 */
export const addressSchema = z.object({
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  box: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
}).nullable();

/**
 * Address Form Schema - NON-NULLABLE versie (voor formulieren)
 * Velden zijn optioneel maar NIET null
 */
export const addressFormSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  box: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('België'),
});

// Types
export type Address = z.infer<typeof addressFormSchema>; // Voor forms
export type AddressNullable = z.infer<typeof addressSchema>; // Voor DB

// Helper functions
export function formatAddress(address: Address | AddressNullable | null): string {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.number,
    address.box ? `bus ${address.box}` : null,
  ].filter(Boolean);
  
  const street = parts.join(' ');
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ');
  
  return [street, cityLine, address.country].filter(Boolean).join(', ');
}

export function isAddressComplete(address: Address | AddressNullable | null): boolean {
  if (!address) return false;
  return !!(address.street && address.city && address.postalCode);
}