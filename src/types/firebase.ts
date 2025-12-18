// src/types/firebase.ts
import { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

// ============================================================================
// CLIENT-SIDE ZOD SCHEMAS (voor Client Components & browser code)
// ============================================================================

/**
 * ✅ CLIENT SDK: Robuust Zod schema voor Firestore Timestamps
 * Valideert Timestamp objects van de client SDK en transformeert naar Date
 */
export const clientTimestampSchema = z.union([
  z.instanceof(ClientTimestamp).transform(t => t.toDate()),
  z.date()
]);

export type ClientFirebaseTimestamp = z.infer<typeof clientTimestampSchema>;

/**
 * ✅ Backwards compatible export (gebruik clientTimestampSchema voor nieuwe code)
 */
export const timestampSchema = clientTimestampSchema;
export type FirebaseTimestamp = ClientFirebaseTimestamp;

// ============================================================================
// SERVER-SIDE ZOD SCHEMAS (voor Server Actions & Server Components)
// ============================================================================

/**
 * ✅ ADMIN SDK: Zod schema voor Firestore Admin Timestamps
 * Valideert Timestamp objects van de admin SDK en transformeert naar Date
 */
export const adminTimestampSchema = z.union([
  z.instanceof(AdminTimestamp).transform(t => t.toDate()),
  z.custom<AdminTimestamp>((val) => {
    // Check for Timestamp-like object with _seconds property
    return val && typeof val === 'object' && '_seconds' in val;
  }).transform((val: any) => new AdminTimestamp(val._seconds, val._nanoseconds || 0).toDate()),
  z.string().transform(str => new Date(str)), // ISO strings
  z.date()
]);

export type AdminFirebaseTimestamp = z.infer<typeof adminTimestampSchema>;

// ============================================================================
// UNIVERSAL SCHEMA (werkt met beide!)
// ============================================================================

/**
 * ✅ UNIVERSAL: Werkt met client OF admin SDK timestamps
 * Gebruik dit als je niet zeker bent welke SDK de data komt
 */
export const universalTimestampSchema = z.union([
  z.instanceof(ClientTimestamp).transform(t => t.toDate()),
  z.instanceof(AdminTimestamp).transform(t => t.toDate()),
  z.custom<any>((val) => {
    return val && typeof val === 'object' && '_seconds' in val;
  }).transform((val: any) => {
    if (val._seconds !== undefined) {
      return new AdminTimestamp(val._seconds, val._nanoseconds || 0).toDate();
    }
    return new Date();
  }),
  z.string().transform(str => new Date(str)),
  z.date()
]);

export type UniversalFirebaseTimestamp = z.infer<typeof universalTimestampSchema>;