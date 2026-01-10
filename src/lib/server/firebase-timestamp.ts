// src/lib/server/firebase-timestamp.ts
'use server';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Converteer Firestore Timestamp of ISO string naar ISO string
 */
export async function tsToIso(val: Timestamp | string | null | undefined): Promise<string | null> {
  return val instanceof Timestamp ? val.toDate().toISOString() : val ?? null;
}

/**
 * Converteer ISO string naar Firestore Timestamp
 */
export async function isoToTs(val: string | null | undefined): Promise<Timestamp | null> {
  return val ? Timestamp.fromDate(new Date(val)) : null;
}
