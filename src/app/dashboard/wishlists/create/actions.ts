// src/app/dashboard/wishlists/create/actions.ts
'use server';

import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { adminDb } from '@/lib/server/firebase-admin';

const schema = z.object({
  name: z.string().min(1),
  backgroundImage: z.string().optional(),
  items: z.array(z.any()),
  eventId: z.string().optional(),
  participantId: z.string().optional(),
});

export async function createWishlistAction(input: unknown) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('UNAUTHENTICATED');
  }

  const data = schema.parse(input);

  await adminDb.collection('wishlists').add({
    ...data,
    userId: session.user.id,
    createdAt: new Date().toISOString(),
  });
}
