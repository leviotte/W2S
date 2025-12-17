// src/lib/utils/date.ts

export function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}
