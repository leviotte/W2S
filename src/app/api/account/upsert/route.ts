// src/app/api/account/upsert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session.server';
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
    const session = await getSession();
if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const body = await req.json();
const parsed = upsertSchema.parse(body);

// 🔑 Gebruik session.user.id ipv session.id
const account = await upsertAccountAction(session.user.id, parsed);

return NextResponse.json({ success: true, account });
  } catch (err: any) {
    console.error('[API] /account/upsert error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
