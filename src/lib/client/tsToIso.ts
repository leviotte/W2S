// src/lib/client/tsToIso.ts
import type { Timestamp } from 'firebase/firestore'; // gebruik client Timestamp

export async function tsToIso(val: Timestamp | string | null | undefined): Promise<string | null> {
  if (!val) return null;
  if (typeof (val as any)?.toDate === 'function') return (val as any).toDate().toISOString();
  if (typeof val === 'string') return val;
  return null;
}
