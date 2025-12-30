// src/lib/server/firestoreHelpers.ts
import { Timestamp } from 'firebase-admin/firestore';

export function convertTimestampsToISO<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (data instanceof Timestamp) {
    return data.toDate().toISOString() as any;
  }

  if (Array.isArray(data)) {
    return data.map(item => convertTimestampsToISO(item)) as any;
  }

  if (typeof data === 'object') {
    const converted: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = (data as any)[key];
        converted[key] = convertTimestampsToISO(value);
      }
    }
    return converted;
  }

  return data;
}
