// src/types/firebase.ts
import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

// GOLD STANDARD: Een robuust, herbruikbaar Zod-schema voor Firestore Timestamps.
// Het valideert zowel het object van de server (`Timestamp`) als een standaard `Date` object
// en transformeert het altijd naar een betrouwbaar JavaScript `Date` object.
export const timestampSchema = z.union([
    z.instanceof(Timestamp).transform(t => t.toDate()),
    z.date()
]);

export type FirebaseTimestamp = z.infer<typeof timestampSchema>;