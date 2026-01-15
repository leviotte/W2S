// src/lib/client/tsToIso.ts
'use server';

import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

/**
 * Convert admin Timestamp | string | Date | null to ISO string
 */
export async function tsToIso(val: AdminTimestamp | string | Date | null | undefined): Promise<string | null> {
  if (!val) return null;

  if (val instanceof AdminTimestamp) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;

  return null;
}
