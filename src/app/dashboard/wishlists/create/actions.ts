'use server';

import { z } from 'zod';
import { getSession } from '@/lib/auth/session.server';
import { adminDb } from '@/lib/server/firebase-admin';

const schema = z.object({
  name: z.string().min(1),
  backgroundImage: z.string().optional(),
  items: z.array(z.any()),
  eventId: z.string().optional(),
  participantId: z.string().optional(),
});

export async function createWishlistAction(input: unknown) {
  const { user } = await getSession();
  if (!user) throw new Error('UNAUTHENTICATED');

  const data = schema.parse(input);

  await adminDb.collection('wishlists').add({
    ...data,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
}
