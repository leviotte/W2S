// src/app/api/account/remove/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session.server';
import { removeFieldAction } from '@/lib/server/actions/account-actions';
import { z } from 'zod';

/* ==========================
   VALIDATION SCHEMA
========================== */
const removeSchema = z.object({
  field: z.enum(['instagram', 'facebook', 'twitter', 'tiktok', 'pinterest']),
});

/* ==========================
   POST HANDLER
========================== */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const body = await req.json();
const { field } = removeSchema.parse(body);

// 🔑 Gebruik session.user.id ipv session.id
const account = await removeFieldAction(session.user.id, field);

return NextResponse.json({ success: true, account });
  } catch (err: any) {
    console.error('[API] /account/remove error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
