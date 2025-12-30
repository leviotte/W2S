// src/lib/server/revalidate.ts
'use server';

import { revalidateTag } from 'next/cache';

export function revalidateUserDashboard(userId: string) {
  // 'default' is hier de profile parameter die vereist is
  revalidateTag(`user-events:${userId}`, 'default');
  revalidateTag(`user-wishlists:${userId}`, 'default');
  revalidateTag(`user-follow:${userId}`, 'default');
}
