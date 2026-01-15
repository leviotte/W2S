// src/app/api/account/upsert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { upsertAccountAction } from '@/lib/server/actions/account-actions';
import { z } from 'zod';

/* ==========================
   VALIDATION SCHEMA
========================== */
const upsertSchema = z.object({
  instagram: z.string().url().or(z.literal('')).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
  twitter: z.string().url().or(z.literal('')).optional(),
  tiktok: z.string().url().or(z.literal('')).optional(),
  pinterest: z.string().url().or(z.literal('')).optional(),
});

/* ==========================
   POST HANDLER
========================== */
export async function POST(req: NextRequest) {
  try {
    // 🔹 Haal session op via NextAuth
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔹 Parse request body en valideer
    const body = await req.json();
    const parsed = upsertSchema.parse(body);

    // 🔹 Voer upsert actie uit
    const account = await upsertAccountAction(userId, parsed);

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    console.error('[API] /account/upsert error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
