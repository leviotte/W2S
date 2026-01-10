'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { accountSchema, type Account } from '@/types/account';
import { getUserProfileAction } from './user-actions';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

/* ============================================================================
 * GET ACCOUNT
 * ========================================================================== */
export async function getAccountAction(userId: string): Promise<Account | null> {
  const accountsRef = adminDb.collection('accounts');
  const snapshot = await accountsRef.where('userId', '==', userId).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  const accountData: Account = {
    id: doc.id,
    userId,
    instagram: data.instagram ?? null,
    facebook: data.facebook ?? null,
    twitter: data.twitter ?? null,
    tiktok: data.tiktok ?? null,
    pinterest: data.pinterest ?? null,
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt:
      data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };

  return accountSchema.parse(accountData);
}

/* ============================================================================
 * UPSERT ACCOUNT
 * ========================================================================== */
const partialAccountSchema = accountSchema.partial().extend({ userId: z.string() });

export async function upsertAccountAction(userId: string, updates: Partial<Account>): Promise<Account> {
  const user = await getUserProfileAction(userId);
  if (!user) throw new Error('User not found');

  // Validatie van updates
  const validatedUpdates = partialAccountSchema.parse({ ...updates, userId });

  const accountsRef = adminDb.collection('accounts');
  const snapshot = await accountsRef.where('userId', '==', userId).get();
  const now = new Date();

  let docRef;
  if (!snapshot.empty) {
    // Update bestaand document
    docRef = snapshot.docs[0].ref;
    await docRef.set(
      { ...validatedUpdates, updatedAt: now },
      { merge: true }
    );
  } else {
    // Nieuw document
    docRef = accountsRef.doc();
    await docRef.set({
      ...validatedUpdates,
      createdAt: now,
      updatedAt: now,
    });
  }

  const updatedDoc = await docRef.get();
  return accountSchema.parse({
    id: docRef.id,
    userId,
    ...updatedDoc.data(),
  });
}

/* ============================================================================
 * REMOVE FIELD
 * ========================================================================== */
const accountFieldSchema = z.enum(['instagram', 'facebook', 'twitter', 'tiktok', 'pinterest']);

export async function removeFieldAction(userId: string, field: string): Promise<Account> {
  const parsedField = accountFieldSchema.parse(field);
  return upsertAccountAction(userId, { [parsedField]: null });
}
