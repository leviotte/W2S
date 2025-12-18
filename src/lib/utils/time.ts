// src/lib/utils/time.ts
// Centrale plek voor tijd- en datum-gerelateerde utility functies.

import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// WRITE UTILITIES (voor timestamps NAAR database)
// ============================================================================

/**
 * Converteert een Date object of een numerieke timestamp naar een ISO 8601 string.
 * Essentieel voor consistente data-uitwisseling tussen server en client.
 * @param date - Het Date object of de timestamp in milliseconden.
 * @returns Een ISO 8601 geformatteerde string.
 */
export const createTimestamp = (date: Date | number): string => {
  return new Date(date).toISOString();
};

/**
 * Genereert de huidige tijd als een ISO 8601 string.
 * @returns De huidige tijd als een ISO 8601 geformatteerde string.
 */
export const nowTimestamp = (): string => new Date().toISOString();

// ============================================================================
// READ UTILITIES (voor timestamps UIT database)
// ============================================================================

/**
 * ✅ Converts Firestore Timestamp, Date, or ISO string to JavaScript Date
 * Werkt met zowel Firebase Admin SDK als Client SDK timestamps.
 * 
 * @param value - Firestore Timestamp, Date object, ISO string, of undefined
 * @returns JavaScript Date object
 * 
 * @example
 * // Firebase Admin SDK Timestamp
 * const date = toDate(doc.data().createdAt);
 * 
 * // ISO string uit database
 * const date = toDate("2024-01-15T10:30:00.000Z");
 * 
 * // Al een Date object
 * const date = toDate(new Date());
 */
export function toDate(value: any): Date {
  // Already a Date object
  if (value instanceof Date) {
    return value;
  }
  
  // Firestore Admin Timestamp (heeft toDate method)
  if (value && typeof value === 'object' && 'toDate' in value) {
    return value.toDate();
  }
  
  // Firestore Admin Timestamp (raw format met _seconds)
  if (value && value._seconds !== undefined) {
    return new Timestamp(value._seconds, value._nanoseconds || 0).toDate();
  }
  
  // ISO string
  if (typeof value === 'string') {
    return new Date(value);
  }
  
  // Fallback naar huidige tijd
  return new Date();
}

/**
 * ✅ Safe toDate met null handling
 * Handig voor optionele timestamp velden.
 * 
 * @param value - Firestore Timestamp, Date, ISO string, null, of undefined
 * @returns JavaScript Date object of null
 */
export function toDateOrNull(value: any): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  return toDate(value);
}

// ============================================================================
// FORMATTING UTILITIES (bonus!)
// ============================================================================

/**
 * Formatteer een datum als "15 januari 2024"
 */
export function formatDate(date: Date | string | any): string {
  const d = typeof date === 'string' ? new Date(date) : toDate(date);
  return new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Formatteer een datum als "15/01/2024 14:30"
 */
export function formatDateTime(date: Date | string | any): string {
  const d = typeof date === 'string' ? new Date(date) : toDate(date);
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Bereken leeftijd op basis van geboortedatum
 */
export function calculateAge(birthdate: Date | string | any): number {
  const birth = typeof birthdate === 'string' ? new Date(birthdate) : toDate(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}